export type TokenPricingInput = {
  inputTokens: number;
  outputTokens: number;
  inputPerMillion: number;
  outputPerMillion: number;
};

export function computeCostCents({
  inputTokens,
  outputTokens,
  inputPerMillion,
  outputPerMillion,
}: TokenPricingInput): number {
  const inputUsd = (inputTokens / 1_000_000) * inputPerMillion;
  const outputUsd = (outputTokens / 1_000_000) * outputPerMillion;
  return Math.max(0, Math.round((inputUsd + outputUsd) * 100));
}

