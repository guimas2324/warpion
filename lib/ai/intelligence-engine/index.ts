import { generateText, streamText } from "ai";
import type { ModelMessage } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getProviderModel } from "@/lib/ai/providers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ChatAttachment, ChatMode, TaskType, UiChatMessage } from "@/types/chat";
import { extractTokenUsage } from "@/lib/ai/usage";
import { buildArchitectedPrompt } from "@/lib/ai/intelligence-engine/prompt-architect";
import { decodeIntent } from "@/lib/ai/intelligence-engine/intent-decoder";
import { runQualityGate } from "@/lib/ai/intelligence-engine/quality-gate";
import { recordUsageAndDebit } from "@/lib/ai/token-ledger";
import { debitTokensWithFallback } from "@/lib/ai/debit-tokens";
import { resolveCostCentsForModel } from "@/lib/ai/cost-cents";

type ToolType = "chat" | "group_work";

type ProcessParams = {
  supabase: SupabaseClient;
  userId: string;
  message: string;
  mode: ChatMode;
  modelId?: string;
  history?: UiChatMessage[];
  attachments?: ChatAttachment[];
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
    visionWarning?: string;
  }) => Promise<void>;
};

type EngineResult = {
  streamResult: ReturnType<typeof streamText>;
  selectedModelId: string;
  provider: string;
  taskType: TaskType;
  intentReasoning: string;
  warnings: string[];
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

async function modelExists(supabase: SupabaseClient, modelId: string) {
  const { data, error } = await supabase
    .from("model_catalog")
    .select("id")
    .eq("id", modelId)
    .eq("is_active", true)
    .eq("model_type", "text")
    .maybeSingle();
  if (error) throw error;
  return Boolean(data?.id);
}

async function resolveModelRow(supabase: SupabaseClient, modelId: string) {
  const { data, error } = await supabase
    .from("model_catalog")
    .select("id, provider, display_name, model_type, supports_vision")
    .eq("id", modelId)
    .eq("is_active", true)
    .eq("model_type", "text")
    .single();
  if (error || !data) throw error ?? new Error("Model not found");
  return data as { id: string; provider: string; display_name: string; model_type: string; supports_vision?: boolean | null };
}

export async function processWithIntelligenceEngine(params: ProcessParams): Promise<EngineResult> {
  const {
    supabase,
    userId,
    message,
    mode,
    modelId,
    history = [],
    attachments = [],
    toolType,
    conversationId,
    requestIp,
    userAgent,
    persistAssistantMessage,
  } = params;

  let admin: ReturnType<typeof createSupabaseAdminClient> | null = null;
  try {
    admin = createSupabaseAdminClient();
  } catch (adminError) {
    console.error("Admin client unavailable in intelligence engine:", adminError);
    admin = null;
  }
  if (!admin) {
    throw new Error("Billing service unavailable. Tente novamente em instantes.");
  }
  const billingAdmin = admin;

  const intent = await decodeIntent({
    supabase,
    message,
    mode,
    selectedModelId: modelId,
  });

  if (mode === "auto" && intent.ambiguous) {
    throw new Error("Pedido ambiguo no modo auto. Especifique melhor o objetivo para continuar.");
  }

  let selectedModelId: string | undefined;

  if (mode === "manual" && modelId) {
    selectedModelId = modelId;
  } else {
    const candidateId = intent.recommended_model;
    if (candidateId && (await modelExists(supabase, candidateId))) {
      selectedModelId = candidateId;
    }
    if (!selectedModelId) {
      selectedModelId = await resolveMappedModelId(supabase, intent.task_type);
    }
    if (!selectedModelId) {
      selectedModelId = "gemini-3-flash";
    }
  }

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
  const warnings: string[] = [];

  async function recordPhaseUsage(params: {
    phase: string;
    modelId: string;
    provider: string;
    inputTokens: number;
    outputTokens: number;
    metadata?: Record<string, unknown>;
  }) {
    const rawTokens = Math.max(0, params.inputTokens + params.outputTokens);
    if (rawTokens <= 0) return null;

    const debit = await debitTokensWithFallback(billingAdmin, {
      userId,
      modelId: params.modelId,
      toolType,
      rawTokens,
    });
    const costCents = await resolveCostCentsForModel({
      admin: billingAdmin,
      modelId: params.modelId,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
    });
    const { error: insertError } = await billingAdmin.from("token_usage_log").insert({
      user_id: userId,
      conversation_id: conversationId ?? null,
      model: params.modelId,
      provider: params.provider,
      tokens_input: params.inputTokens,
      tokens_output: params.outputTokens,
      cost_cents: costCents,
      tool_type: toolType,
      phase: params.phase,
      metadata: {
        debit_result: {
          ...debit.data,
          signature: debit.signature,
        },
        ...(params.metadata ?? {}),
      },
    });
    if (insertError) {
      console.error(`token_usage_log insert failed for phase ${params.phase}:`, insertError);
    }
    return { debit, costCents };
  }

  if (intent.usage) {
    await recordPhaseUsage({
      phase: "intent_decoder",
      modelId: intent.usage.modelId,
      provider: intent.usage.provider,
      inputTokens: intent.usage.inputTokens,
      outputTokens: intent.usage.outputTokens,
      metadata: {
        intent_reasoning: intent.reasoning,
      },
    });
  }

  const modelMessages: ModelMessage[] = [
    ...history.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  const imageAttachments = attachments.filter(
    (item) => item.mimeType.startsWith("image/") && typeof item.publicUrl === "string" && item.publicUrl.length > 0,
  );
  if (imageAttachments.length > 0 && modelRow.supports_vision) {
    modelMessages[modelMessages.length - 1] = {
      role: "user",
      content: [
        { type: "text" as const, text: message },
        ...imageAttachments.map((img) => ({ type: "image" as const, image: img.publicUrl as string })),
      ],
    };
  } else if (imageAttachments.length > 0 && !modelRow.supports_vision) {
    const warning = `Model ${selectedModelId} does not support vision. Image attachments ignored.`;
    console.warn(warning);
    warnings.push(warning);
  }

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

      let debitResult: unknown = null;
      let usedLedgerFallback = false;
      try {
        const debit = await debitTokensWithFallback(billingAdmin, {
          userId,
          modelId: selectedModelId,
          toolType,
          rawTokens,
        });
        debitResult = {
          ...debit.data,
          signature: debit.signature,
        };
      } catch (debitError) {
        // Fallback to legacy ledger debit if RPC is unavailable/misconfigured.
        console.error("debit_tokens RPC failed, falling back to ledger:", debitError);
        await recordUsageAndDebit({
          userId,
          conversationId: conversationId ?? "",
          modelId: selectedModelId,
          provider: modelRow.provider,
          inputTokens: tokens.inputTokens,
          outputTokens: tokens.outputTokens,
          toolType,
          phase: intent.task_type,
        });
        usedLedgerFallback = true;
        debitResult = { success: true, fallback: "recordUsageAndDebit" };
      }

      if (persistAssistantMessage) {
        await persistAssistantMessage({
          text,
          selectedModelId,
          provider: modelRow.provider,
          taskType: intent.task_type,
          inputTokens: tokens.inputTokens,
          outputTokens: tokens.outputTokens,
          visionWarning: warnings[0],
        });
      }

      if (!usedLedgerFallback && rawTokens > 0) {
        const costCents = await resolveCostCentsForModel({
          admin: billingAdmin,
          modelId: selectedModelId,
          inputTokens: tokens.inputTokens,
          outputTokens: tokens.outputTokens,
        });
        const { error: usageInsertError } = await billingAdmin.from("token_usage_log").insert({
          user_id: userId,
          conversation_id: conversationId ?? null,
          model: selectedModelId,
          provider: modelRow.provider,
          tokens_input: tokens.inputTokens,
          tokens_output: tokens.outputTokens,
          cost_cents: costCents,
          tool_type: toolType,
          phase: intent.task_type,
          metadata: {
            debit_result: debitResult,
            selected_skills: selectedSkills,
            intent_reasoning: intent.reasoning,
            warnings,
          },
        });
        if (usageInsertError) {
          console.error("token_usage_log insert failed:", usageInsertError);
        }
      }

      const quality = await runQualityGate({
        supabase,
        message,
        answer: text,
        taskType: intent.task_type,
      });
      if (quality.usage) {
        await recordPhaseUsage({
          phase: "quality_gate",
          modelId: quality.usage.modelId,
          provider: quality.usage.provider,
          inputTokens: quality.usage.inputTokens,
          outputTokens: quality.usage.outputTokens,
          metadata: {
            passed: quality.passed,
            completeness: quality.completeness,
          },
        });
      }

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
        const retryUsage = extractTokenUsage(improved.usage);
        await recordPhaseUsage({
          phase: "quality_gate_retry",
          modelId: selectedModelId,
          provider: modelRow.provider,
          inputTokens: retryUsage.inputTokens,
          outputTokens: retryUsage.outputTokens,
          metadata: {
            trigger: "quality_gate",
          },
        });

        const { error: auditRetryError } = await billingAdmin.schema("private").rpc("log_audit", {
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
        if (auditRetryError) {
          console.error("quality_gate_retry audit failed:", auditRetryError);
        }
      }

      const { error: auditMainError } = await billingAdmin.schema("private").rpc("log_audit", {
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
      if (auditMainError) {
        console.error("intelligence_engine_processed audit failed:", auditMainError);
      }
    },
  });

  return {
    streamResult,
    selectedModelId,
    provider: modelRow.provider,
    taskType: intent.task_type,
    intentReasoning: intent.reasoning,
    warnings,
  };
}
