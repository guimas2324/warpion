import { generateText } from "ai";
import { getProviderModel } from "@/lib/ai/providers";
import { recordUsageAndDebit } from "@/lib/ai/token-ledger";
import { extractTokenUsage } from "@/lib/ai/usage";

export type GroupWorkAgent = {
  label: string;
  role: string;
  modelId: string;
  provider: string;
  apiKey?: string;
};

export type GroupWorkPhase = {
  id: number;
  name: string;
  prompt: string;
  agent: GroupWorkAgent;
  messageRole: "agent_1" | "agent_2" | "agent_3" | "orchestrator" | "synthesis";
};

export async function runGroupWorkPhase(params: {
  phase: GroupWorkPhase;
  conversationId: string;
  userId: string;
  accumulatedContext: string;
}) {
  const { phase, conversationId, userId, accumulatedContext } = params;
  const model = getProviderModel(phase.agent.provider, phase.agent.modelId, phase.agent.apiKey);

  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort("timeout"), 120_000);

  const result = await generateText({
    model,
    prompt: `${phase.prompt}\n\nContext:\n${accumulatedContext}`.trim(),
    abortSignal: abort.signal,
  });
  clearTimeout(timeout);
  const tokens = extractTokenUsage(result.usage);

  await recordUsageAndDebit({
    userId,
    conversationId,
    modelId: phase.agent.modelId,
    provider: phase.agent.provider,
    inputTokens: tokens.inputTokens,
    outputTokens: tokens.outputTokens,
    toolType: "group_work",
    phase: phase.name,
  });

  return {
    text: result.text,
    usage: result.usage,
  };
}

