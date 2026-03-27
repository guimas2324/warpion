export const runtime = "nodejs";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ChatRequestPayload, UiChatMessage } from "@/types/chat";
import { processWithIntelligenceEngine } from "@/lib/ai/intelligence-engine";
import { generateText } from "ai";
import { getProviderModel } from "@/lib/ai/providers";

function getClientIp(request: Request) {
  const header = request.headers.get("x-forwarded-for");
  if (!header) return null;
  return header.split(",")[0]?.trim() || null;
}

function extractMessageText(input: unknown) {
  if (typeof input === "string") return input.trim();
  if (Array.isArray(input)) {
    return input
      .filter((part) => part && typeof part === "object" && "type" in part && "text" in part)
      .filter((part) => (part as { type: unknown }).type === "text")
      .map((part) => String((part as { text: unknown }).text ?? ""))
      .join("")
      .trim();
  }
  return "";
}

function normalizeHistory(rawHistory: unknown): UiChatMessage[] {
  if (!Array.isArray(rawHistory)) return [];

  return rawHistory
    .map((message, index) => {
      const msg = message as {
        id?: unknown;
        role?: unknown;
        content?: unknown;
        parts?: unknown;
      };
      const role = msg.role === "assistant" || msg.role === "system" ? msg.role : "user";
      const content = extractMessageText(msg.content) || extractMessageText(msg.parts);
      if (!content) return null;
      return {
        id: typeof msg.id === "string" && msg.id ? msg.id : `h-${index}`,
        role,
        content,
      } satisfies UiChatMessage;
    })
    .filter((item): item is UiChatMessage => item !== null);
}

async function generateConversationTitle(params: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  message: string;
}) {
  const { supabase, message } = params;
  const cheapModelIds = ["claude-haiku-4-5", "gemini-3-flash", "deepseek-v3.2"];
  const { data: models } = await supabase
    .from("model_catalog")
    .select("id, provider")
    .in("id", cheapModelIds)
    .eq("is_active", true);

  const picked = cheapModelIds
    .map((id) => (models ?? []).find((m) => m.id === id))
    .find(Boolean) as { id: string; provider: string } | undefined;

  if (!picked) return message.split("\n")[0].slice(0, 60);
  const model = getProviderModel(picked.provider, picked.id);

  try {
    const result = await generateText({
      model,
      prompt: [
        "Gere um titulo curto em portugues para a conversa.",
        "Regra: maximo 6 palavras, sem aspas, sem ponto final.",
        `Mensagem inicial: ${message}`,
      ].join("\n"),
      maxOutputTokens: 24,
    });
    const title = result.text.trim().replace(/^["']|["']$/g, "");
    return title.slice(0, 80) || message.split("\n")[0].slice(0, 60);
  } catch {
    return message.split("\n")[0].slice(0, 60);
  }
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ data: null, error: "Unauthorized", meta: {} }), { status: 401 });

  try {
    const raw = (await request.json()) as {
      message?: unknown;
      messages?: unknown;
      mode?: unknown;
      model_id?: unknown;
      conversation_id?: unknown;
      history?: unknown;
      attachments?: unknown;
    };

    let message = extractMessageText(raw.message);
    if (!message && Array.isArray(raw.messages)) {
      const lastUserMessage = [...raw.messages]
        .reverse()
        .find((item) => (item as { role?: unknown })?.role === "user") as
        | { content?: unknown; parts?: unknown }
        | undefined;
      message = extractMessageText(lastUserMessage?.content) || extractMessageText(lastUserMessage?.parts);
    }

    if (!message) return new Response(JSON.stringify({ data: null, error: "Message is required", meta: {} }), { status: 400 });

    const history = normalizeHistory(raw.history ?? raw.messages);
    const body = {
      message,
      mode: raw.mode === "manual" ? "manual" : "auto",
      model_id: typeof raw.model_id === "string" ? raw.model_id : undefined,
      conversation_id: typeof raw.conversation_id === "string" ? raw.conversation_id : undefined,
      history,
      attachments: Array.isArray(raw.attachments) ? raw.attachments : [],
    } satisfies ChatRequestPayload;

    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("tokens_remaining")
      .eq("id", user.id)
      .single();
    if (profileError) throw profileError;
    if (Number(profileRow.tokens_remaining ?? 0) <= 0) {
      return new Response(JSON.stringify({ data: null, error: "Insufficient tokens", meta: {} }), { status: 402 });
    }

    const clientIp = getClientIp(request);
    const userAgent = request.headers.get("user-agent");
    const { data: allowed, error: rateError } = await admin
      .schema("private")
      .rpc("check_rate_limit", {
        user_id: user.id,
        ip: clientIp,
        endpoint: "/api/chat",
        max_requests: 120,
        window_minutes: 5,
      });

    if (rateError) throw rateError;
    if (!allowed) {
      return new Response(JSON.stringify({ data: null, error: "Rate limit exceeded", meta: {} }), { status: 429 });
    }

    const isFirstMessage = !body.conversation_id;
    let conversationId = body.conversation_id;
    if (isFirstMessage) {
      const { data: createdConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          tool_type: "chat",
          title: message.split("\n")[0].slice(0, 80),
          mode: body.mode,
          model_used: null,
          status: "active",
        })
        .select("id")
        .single();
      if (convError) throw convError;
      conversationId = createdConv.id;
    }

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: message,
      model: body.model_id ?? null,
      provider: null,
      phase: body.mode,
      attachments: body.attachments ?? [],
    });

    const engine = await processWithIntelligenceEngine({
      supabase,
      userId: user.id,
      message,
      mode: body.mode,
      modelId: body.model_id,
      history: body.history ?? [],
      toolType: "chat",
      conversationId,
      requestIp: clientIp ?? undefined,
      userAgent: userAgent ?? undefined,
      persistAssistantMessage: async (params) => {
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          role: "assistant",
          content: params.text,
          model: params.selectedModelId,
          provider: params.provider,
          tokens_input: params.inputTokens,
          tokens_output: params.outputTokens,
          phase: body.mode,
          metadata: {
            routed_task_type: params.taskType,
            mode: body.mode,
            model: params.selectedModelId,
            provider: params.provider,
          },
        });

        await supabase
          .from("conversations")
          .update({
            model_used: params.selectedModelId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", conversationId);

        if (isFirstMessage) {
          const title = await generateConversationTitle({ supabase, message });
          await supabase
            .from("conversations")
            .update({ title })
            .eq("id", conversationId);
        }
      },
    });

    return engine.streamResult.toUIMessageStreamResponse({
      headers: {
        "x-conversation-id": conversationId ?? "",
        "x-selected-model": engine.selectedModelId,
        "x-selected-task": engine.taskType,
        "x-intent-reasoning": engine.intentReasoning,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat request failed";
    return new Response(JSON.stringify({ data: null, error: message, meta: {} }), { status: 500 });
  }
}

