import { createSupabaseServerClient } from "@/lib/supabase/server";
import { runGroupWorkPhase, type GroupWorkAgent, type GroupWorkPhase } from "@/lib/ai/group-work-engine";

type RequestBody = {
  message: string;
  specialty: string;
  attachments?: Array<{ name: string; publicUrl?: string; path?: string }>;
  conversation_id?: string;
};

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = (await request.json()) as RequestBody;
  if (!body.message?.trim() || !body.specialty?.trim()) {
    return new Response("message and specialty are required", { status: 400 });
  }

  const { data: specialtyRow, error: specialtyError } = await supabase
    .from("group_work_specialties")
    .select("specialty, model_1, model_1_role, model_2, model_2_role, model_3, model_3_role, display_name")
    .eq("specialty", body.specialty)
    .single();
  if (specialtyError || !specialtyRow) return new Response("Specialty not found", { status: 404 });

  const { data: skills } = await supabase
    .from("skills")
    .select("name, system_prompt, category")
    .eq("is_active", true)
    .in("category", ["core", "task", "advanced"]);
  const skillContext = (skills ?? [])
    .filter((s) => s.system_prompt)
    .map((s) => `${s.name}: ${s.system_prompt}`)
    .join("\n");

  const modelIds = [specialtyRow.model_1, specialtyRow.model_2, specialtyRow.model_3].filter(Boolean);
  const { data: modelRows, error: modelError } = await supabase
    .from("model_catalog")
    .select("id, provider")
    .in("id", modelIds);
  if (modelError) return new Response(modelError.message, { status: 500 });

  const providerById = new Map((modelRows ?? []).map((m) => [m.id, m.provider]));
  const agent1: GroupWorkAgent = {
    label: "Agente 1",
    role: specialtyRow.model_1_role || "Arquiteto",
    modelId: specialtyRow.model_1,
    provider: providerById.get(specialtyRow.model_1) || "openai",
  };
  const agent2: GroupWorkAgent = {
    label: "Agente 2",
    role: specialtyRow.model_2_role || "Implementador",
    modelId: specialtyRow.model_2,
    provider: providerById.get(specialtyRow.model_2) || "openai",
  };
  const agent3: GroupWorkAgent = {
    label: "Agente 3",
    role: specialtyRow.model_3_role || "Revisor",
    modelId: specialtyRow.model_3,
    provider: providerById.get(specialtyRow.model_3) || "openai",
  };

  let conversationId = body.conversation_id;
  if (!conversationId) {
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        tool_type: "group_work",
        specialty: body.specialty,
        title: body.message.slice(0, 80),
        status: "active",
      })
      .select("id")
      .single();
    if (error) return new Response(error.message, { status: 500 });
    conversationId = data.id;
  }

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: body.message,
    attachments: body.attachments ?? [],
    phase: "request",
  });

  const phases: GroupWorkPhase[] = [
    { id: 1, name: "DESFRAGMENTAR", prompt: `${skillContext}\n\nQuebre o pedido em subtarefas: ${body.message}`, agent: agent1, messageRole: "agent_1" },
    { id: 2, name: "RACIOCINAR_A2", prompt: `${skillContext}\n\nRaciocine profundamente sobre a tarefa: ${body.message}`, agent: agent2, messageRole: "agent_2" },
    { id: 2, name: "RACIOCINAR_A3", prompt: `${skillContext}\n\nRaciocine profundamente com outra abordagem: ${body.message}`, agent: agent3, messageRole: "agent_3" },
    { id: 3, name: "CHECAR_ANEXOS", prompt: `${skillContext}\n\nAnalise anexos e riscos para: ${body.message}. Anexos: ${JSON.stringify(body.attachments ?? [])}`, agent: agent1, messageRole: "orchestrator" },
    { id: 4, name: "PLANO_DE_EXECUCAO", prompt: `${skillContext}\n\nCrie plano detalhado numerado para executar a tarefa`, agent: agent1, messageRole: "agent_1" },
    { id: 5, name: "EXECUTAR", prompt: `${skillContext}\n\nExecute a tarefa de ponta a ponta com entrega objetiva`, agent: agent1, messageRole: "agent_1" },
    { id: 6, name: "REVISAO_CRUZADA", prompt: `${skillContext}\n\nRevise criticamente o resultado para falhas e melhorias`, agent: agent3, messageRole: "agent_3" },
    { id: 7, name: "SINTESE_FINAL", prompt: `${skillContext}\n\nConsolide tudo em uma resposta final clara`, agent: agent1, messageRole: "synthesis" },
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(
          sse("meta", {
            conversation_id: conversationId,
            specialty: specialtyRow.display_name,
            agents: [agent1, agent2, agent3],
          }),
        ),
      );

      let accumulated = `User request: ${body.message}`;
      for (const phase of phases) {
        const startedAt = Date.now();
        controller.enqueue(encoder.encode(sse("phase_start", { phase: phase.name, step: phase.id })));
        try {
          const result = await runGroupWorkPhase({
            phase,
            conversationId: conversationId!,
            userId: user.id,
            accumulatedContext: accumulated,
          });

          accumulated += `\n\n[${phase.name}] ${result.text}`;

          await supabase.from("messages").insert({
            conversation_id: conversationId,
            role: phase.messageRole,
            content: result.text,
            model: phase.agent.modelId,
            provider: phase.agent.provider,
            phase: phase.name,
            metadata: {
              agent_label: phase.agent.label,
              agent_role: phase.agent.role,
              elapsed_ms: Date.now() - startedAt,
            },
          });

          controller.enqueue(
            encoder.encode(
              sse("phase_chunk", {
                phase: phase.name,
                step: phase.id,
                agent: phase.agent.label,
                role: phase.agent.role,
                text: result.text,
                elapsed_ms: Date.now() - startedAt,
              }),
            ),
          );
          controller.enqueue(encoder.encode(sse("phase_complete", { phase: phase.name, step: phase.id })));
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              sse("phase_error", {
                phase: phase.name,
                step: phase.id,
                error: error instanceof Error ? error.message : "Unknown phase error",
              }),
            ),
          );
          break;
        }
      }

      controller.enqueue(encoder.encode(sse("done", { ok: true })));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

