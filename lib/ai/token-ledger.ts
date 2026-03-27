import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { computeCostCents } from "@/lib/ai/token-pricing";

type UsageRecordParams = {
  userId: string;
  conversationId: string;
  modelId: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  toolType: "chat" | "group_work";
  phase: string;
};

export async function recordUsageAndDebit(params: UsageRecordParams) {
  const admin = createSupabaseAdminClient();
  const { userId, conversationId, modelId, provider, inputTokens, outputTokens, toolType, phase } = params;

  const { data: modelRow, error: modelError } = await admin
    .from("model_catalog")
    .select("cost_input_per_m, cost_output_per_m")
    .eq("id", modelId)
    .single();
  if (modelError) throw modelError;

  const costCents = computeCostCents({
    inputTokens,
    outputTokens,
    inputPerMillion: Number(modelRow.cost_input_per_m ?? 0),
    outputPerMillion: Number(modelRow.cost_output_per_m ?? 0),
  });

  const totalTokens = Math.max(0, inputTokens + outputTokens);

  // Concurrency-safe debit with compare-and-swap (CAS) retries.
  let remainingTokens = 0;
  let debitApplied = false;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: profileRow, error: profileError } = await admin
      .from("profiles")
      .select("tokens_remaining, tokens_used_total")
      .eq("id", userId)
      .single();
    if (profileError) throw profileError;

    const currentRemaining = Number(profileRow.tokens_remaining ?? 0);
    const currentUsedTotal = Number(profileRow.tokens_used_total ?? 0);
    if (currentRemaining < totalTokens) {
      throw new Error("Insufficient tokens");
    }

    const nextRemaining = Math.max(0, currentRemaining - totalTokens);
    const nextUsedTotal = currentUsedTotal + totalTokens;

    const { data: updated, error: updateError } = await admin
      .from("profiles")
      .update({
        tokens_remaining: nextRemaining,
        tokens_used_total: nextUsedTotal,
      })
      .eq("id", userId)
      .eq("tokens_remaining", currentRemaining)
      .select("tokens_remaining")
      .maybeSingle();

    if (updateError) throw updateError;
    if (updated) {
      remainingTokens = Number(updated.tokens_remaining ?? nextRemaining);
      debitApplied = true;
      break;
    }

    // Lost CAS race; retry.
    await new Promise((r) => setTimeout(r, 30 * (attempt + 1)));
  }

  if (!debitApplied && totalTokens > 0) {
    throw new Error("Token debit failed due to concurrent updates");
  }

  const { error: usageError } = await admin.from("token_usage_log").insert({
    user_id: userId,
    conversation_id: conversationId,
    model: modelId,
    provider,
    tokens_input: inputTokens,
    tokens_output: outputTokens,
    cost_cents: costCents,
    tool_type: toolType,
    phase,
  });
  if (usageError) throw usageError;

  return { costCents, remainingTokens };
}

