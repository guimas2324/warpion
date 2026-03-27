type UsageLike = {
  inputTokens?: number;
  outputTokens?: number;
  promptTokens?: number;
  completionTokens?: number;
};

export function extractTokenUsage(usage: UsageLike | null | undefined) {
  const inputTokens = Number(usage?.inputTokens ?? usage?.promptTokens ?? 0);
  const outputTokens = Number(usage?.outputTokens ?? usage?.completionTokens ?? 0);
  return {
    inputTokens: Number.isFinite(inputTokens) ? inputTokens : 0,
    outputTokens: Number.isFinite(outputTokens) ? outputTokens : 0,
  };
}
