import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

export function getProviderModel(provider: string, modelId: string, apiKey?: string) {
  const normalized = provider.toLowerCase();

  if (normalized.includes("openai")) {
    return createOpenAI({ apiKey: apiKey ?? process.env.OPENAI_API_KEY })(modelId);
  }
  if (normalized.includes("anthropic")) {
    return createAnthropic({ apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY })(modelId);
  }
  if (normalized.includes("google") || normalized.includes("gemini")) {
    return createGoogleGenerativeAI({ apiKey: apiKey ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY })(modelId);
  }
  if (normalized.includes("deepseek")) {
    return createOpenAI({ apiKey: apiKey ?? process.env.DEEPSEEK_API_KEY, baseURL: "https://api.deepseek.com/v1" })(modelId);
  }
  if (normalized.includes("xai") || normalized.includes("grok")) {
    return createOpenAI({ apiKey: apiKey ?? process.env.XAI_API_KEY, baseURL: "https://api.x.ai/v1" })(modelId);
  }

  throw new Error(`Provider not supported: ${provider}`);
}

