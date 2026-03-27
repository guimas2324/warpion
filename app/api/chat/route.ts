export const runtime = "nodejs";

import { streamText } from "ai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProviderModel } from "@/lib/ai/providers";
import { resolveModelId } from "@/lib/ai/model-router";
import type { ChatRequestPayload } from "@/types/chat";
import { recordUsageAndDebit } from "@/lib/ai/token-ledger";
import { decryptSecret } from "@/lib/security/secrets";

function normalizeProvider(provider: string) {
  const p = provider.toLowerCase();
  if (p.includes("openai")) return "openai";
  if (p.includes("anthropic")) return "anthropic";
  if (p.includes("google") || p.includes("gemini")) return "google";
  if (p.includes("deepseek")) return "deepseek";
  if (p.includes("xai") || p.includes("grok")) return "xai";
  return p;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ data: null, error: "Unauthorized", meta: {} }), { status: 401 });

  let conversationId: string | undefined;
  let selectedModel = "";

  try {
    const body = (await request.json()) as ChatRequestPayload;
    const message = body.message?.trim();
    if (!message) return new Response(JSON.stringify({ data: null, error: "Message is required", meta: {} }), { status: 400 });

    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("tokens_remaining")
      .eq("id", user.id)
      .single();
    if (profileError) throw profileError;
    if (Number(profileRow.tokens_remaining ?? 0) <= 0) {
      return new Response(JSON.stringify({ data: null, error: "Insufficient tokens", meta: {} }), { status: 402 });
    }

    const route = await resolveModelId({
      mode: body.mode,
      modelId: body.model_id,
      message,
      supabase,
    });
    selectedModel = route.modelId;

    const { data: modelRow, error: modelError } = await supabase
      .from("model_catalog")
      .select("id, provider")
      .eq("id", selectedModel)
      .single();
    if (modelError || !modelRow) throw modelError ?? new Error("Model not found");

    const { data: skills, error: skillError } = await supabase
      .from("skills")
      .select("name, system_prompt, category, is_active")
      .eq("is_active", true)
      .in("category", ["core", "task"])
      .order("priority", { ascending: true });
    if (skillError) throw skillError;

    const systemPrompt = [
      "You are WARPION Chat Otimizado. Be precise, practical, and safe.",
      ...(skills ?? []).map((s) => `${s.name}: ${s.system_prompt ?? ""}`),
    ].join("\n\n");

    if (!body.conversation_id) {
      const { data: createdConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          tool_type: "chat",
          title: message.split("\n")[0].slice(0, 80),
          mode: body.mode,
          model_used: selectedModel,
          status: "active",
        })
        .select("id")
        .single();
      if (convError) throw convError;
      conversationId = createdConv.id;
    } else {
      conversationId = body.conversation_id;
    }

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: message,
      model: selectedModel,
      provider: modelRow.provider,
      phase: body.mode,
      attachments: body.attachments ?? [],
    });

    const { data: userKey } = await supabase
      .from("user_api_keys")
      .select("encrypted_key")
      .eq("user_id", user.id)
      .eq("provider", normalizeProvider(modelRow.provider))
      .eq("is_active", true)
      .maybeSingle();
    const decryptedKey = userKey?.encrypted_key ? decryptSecret(userKey.encrypted_key) : undefined;

    const model = getProviderModel(modelRow.provider, selectedModel, decryptedKey);
    const messages = [
      ...(body.history ?? []).map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort("timeout"), 30_000);

    const result = streamText({
      model,
      system: systemPrompt,
      messages,
      abortSignal: abort.signal,
      onFinish: async ({ text, usage }) => {
        clearTimeout(timeout);
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          role: "assistant",
          content: text,
          model: selectedModel,
          provider: modelRow.provider,
          tokens_input: usage.promptTokens ?? 0,
          tokens_output: usage.completionTokens ?? 0,
          phase: body.mode,
          metadata: { routed_task_type: route.taskType, mode: route.mode },
        });

        await recordUsageAndDebit({
          userId: user.id,
          conversationId: conversationId ?? "",
          modelId: selectedModel,
          provider: modelRow.provider,
          inputTokens: usage.promptTokens ?? 0,
          outputTokens: usage.completionTokens ?? 0,
          toolType: "chat",
          phase: route.taskType,
        });
      },
    });

    return result.toDataStreamResponse({
      headers: {
        "x-conversation-id": conversationId ?? "",
        "x-selected-model": selectedModel,
        "x-selected-task": route.taskType,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat request failed";
    return new Response(JSON.stringify({ data: null, error: message, meta: {} }), { status: 500 });
  }
}

