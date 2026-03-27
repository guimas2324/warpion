import type { SupabaseClient } from "@supabase/supabase-js";
import { computeCostCents } from "@/lib/ai/token-pricing";

export async function resolveCostCentsForModel(params: {
  admin: SupabaseClient;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
}) {
  const { admin, modelId, inputTokens, outputTokens } = params;
  const { data: modelRow, error } = await admin
    .from("model_catalog")
    .select("cost_input_per_m, cost_output_per_m")
    .eq("id", modelId)
    .maybeSingle();

  if (error || !modelRow) return 0;

  return computeCostCents({
    inputTokens,
    outputTokens,
    inputPerMillion: Number(modelRow.cost_input_per_m ?? 0),
    outputPerMillion: Number(modelRow.cost_output_per_m ?? 0),
  });
}
