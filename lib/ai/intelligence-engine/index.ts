import { generateText, streamText } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getProviderModel } from "@/lib/ai/providers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ChatMode, TaskType, UiChatMessage } from "@/types/chat";
import { extractTokenUsage } from "@/lib/ai/usage";
import { buildArchitectedPrompt } from "@/lib/ai/intelligence-engine/prompt-architect";
import { decodeIntent } from "@/lib/ai/intelligence-engine/intent-decoder";
import { runQualityGate } from "@/lib/ai/intelligence-engine/quality-gate";

type ToolType = "chat" | "group_work";

type ProcessParams = {
  supabase: SupabaseClient;
  userId: string;
  message: string;
  mode: ChatMode;
  modelId?: string;
  history?: UiChatMessage[];
  toolType: ToolType;
  conversationId?: string;
  requestIp?: string;
  userAgent?: string;
  persistAssistantMessage?: (params: {
    text: string;
    selectedModelId: string;
    provider: string;
    taskType: TaskType;
    inputTokens: number;
    outputTokens: number;
  }) => Promise<void>;
};

type EngineResult = {
  streamResult: ReturnType<typeof streamText>;
  selectedModelId: string;
  provider: string;
  taskType: TaskType;
  intentReasoning: string;
};

async function resolveMappedModelId(supabase: SupabaseClient, taskType: TaskType) {
  const { data } = await supabase
    .from("task_model_map")
    .select("model_ids")
    .eq("task_type", taskType)
    .maybeSingle();
  const mapped = Array.isArray(data?.model_ids) ? (data.model_ids as string[]) : [];
  return mapped[0];
}

async function resolveModelRow(supabase: SupabaseClient, modelId: string) {
  const { data, error } = await supabase
    .from("model_catalog")
    .select("id, provider, display_name")
    .eq("id", modelId)
    .eq("is_active", true)
    .single();
  if (error || !data) throw error ?? new Error("Model not found");
  return data as { id: string; provider: string; display_name: string };
}

export async function processWithIntelligenceEngine(params: ProcessParams): Promise<EngineResult> {
  const {
    supabase,
    userId,
    message,
    mode,
    modelId,
    history = [],
    toolType,
    conversationId,
    requestIp,
    userAgent,
    persistAssistantMessage,
  } = params;

  const intent = await decodeIntent({
    supabase,
    message,
    mode,
    selectedModelId: modelId,
  });

  if (mode === "auto" && intent.ambiguous) {
    throw new Error("Pedido ambiguo no modo auto. Especifique melhor o objetivo para continuar.");
  }

  const selectedModelId =
    mode === "manual"
      ? modelId
      : intent.recommended_model || (await resolveMappedModelId(supabase, intent.task_type));

  if (!selectedModelId) {
    throw new Error("Nao foi possivel selecionar um modelo para esta tarefa.");
  }

  const modelRow = await resolveModelRow(supabase, selectedModelId);
  const { systemPrompt, selectedSkills } = await buildArchitectedPrompt({
    supabase,
    taskType: intent.task_type,
    complexity: intent.complexity,
    message,
  });

  const model = getProviderModel(modelRow.provider, selectedModelId);
  const admin = createSupabaseAdminClient();
  const modelMessages = [
    ...history.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort("timeout"), 30_000);

  const streamResult = streamText({
    model,
    system: systemPrompt,
    messages: modelMessages,
    abortSignal: abort.signal,
    onFinish: async ({ text, usage }) => {
      clearTimeout(timeout);
      const tokens = extractTokenUsage(usage);
      const rawTokens = Math.max(0, tokens.inputTokens + tokens.outputTokens);

      const debitPayload = {
        user_id: userId,
        model_id: selectedModelId,
        tool_type: toolType,
        raw_tokens: rawTokens,
      };
      const { data: debitResult, error: debitError } = await admin.rpc("debit_tokens", debitPayload);
      if (debitError) throw debitError;

      if (persistAssistantMessage) {
        await persistAssistantMessage({
          text,
          selectedModelId,
          provider: modelRow.provider,
          taskType: intent.task_type,
          inputTokens: tokens.inputTokens,
          outputTokens: tokens.outputTokens,
        });
      }

      await admin.from("token_usage_log").insert({
        user_id: userId,
        conversation_id: conversationId ?? null,
        model: selectedModelId,
        provider: modelRow.provider,
        tokens_input: tokens.inputTokens,
        tokens_output: tokens.outputTokens,
        cost_cents: 0,
        tool_type: toolType,
        phase: intent.task_type,
        metadata: {
          debit_result: debitResult,
          selected_skills: selectedSkills,
          intent_reasoning: intent.reasoning,
        },
      });

      const quality = await runQualityGate({
        supabase,
        message,
        answer: text,
        taskType: intent.task_type,
      });

      if (!quality.passed && quality.completeness < 70) {
        const improved = await generateText({
          model,
          prompt: [
            "Improve the previous response based on this quality feedback.",
            `Issues: ${quality.issues.join("; ") || "none"}`,
            `Suggestion: ${quality.suggestion}`,
            "",
            "Original response:",
            text,
          ].join("\n"),
        });

        await admin.schema("private").rpc("log_audit", {
          user_id: userId,
          action: "quality_gate_retry",
          resource_type: "chat_message",
          resource_id: conversationId ?? null,
          ip: requestIp ?? null,
          user_agent: userAgent ?? null,
          metadata: {
            quality,
            improved_preview: improved.text.slice(0, 300),
          },
        });
      }

      await admin.schema("private").rpc("log_audit", {
        user_id: userId,
        action: "intelligence_engine_processed",
        resource_type: "chat",
        resource_id: conversationId ?? null,
        ip: requestIp ?? null,
        user_agent: userAgent ?? null,
        metadata: {
          task_type: intent.task_type,
          model_id: selectedModelId,
          model_provider: modelRow.provider,
          selected_skills: selectedSkills,
          quality,
        },
      });
    },
  });

  return {
    streamResult,
    selectedModelId,
    provider: modelRow.provider,
    taskType: intent.task_type,
    intentReasoning: intent.reasoning,
  };
}
