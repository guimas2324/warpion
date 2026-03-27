import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

const MODEL_API_MAP: Record<string, string> = {
  "gpt-5.2": "gpt-5.2",
  "gpt-5.4": "gpt-5.4",
  o3: "o3",
  "claude-haiku-4-5": "claude-haiku-4-5-20251001",
  "claude-sonnet-4-6": "claude-sonnet-4-6-20250220",
  "claude-opus-4-6": "claude-opus-4-6-20250220",
  "gemini-3-flash": "gemini-3-flash",
  "gemini-3-pro": "gemini-3.1-pro-preview",
  "deepseek-v3.2": "deepseek-chat",
  "grok-4.1": "grok-4.1-fast",
};

function resolveApiModelId(catalogId: string): string {
  return MODEL_API_MAP[catalogId] ?? catalogId;
}

export function getProviderModel(provider: string, catalogModelId: string) {
  const normalized = provider.toLowerCase();
  const apiModelId = resolveApiModelId(catalogModelId);

  if (normalized.includes("openai")) {
    return createOpenAI({ apiKey: process.env.OPENAI_API_KEY! })(apiModelId);
  }
  if (normalized.includes("anthropic")) {
    return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })(apiModelId);
  }
  if (normalized.includes("google") || normalized.includes("gemini")) {
    return createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! })(apiModelId);
  }
  if (normalized.includes("deepseek")) {
    return createOpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY!,
      baseURL: "https://api.deepseek.com",
    })(apiModelId);
  }
  if (normalized.includes("xai") || normalized.includes("grok")) {
    return createOpenAI({
      apiKey: process.env.XAI_API_KEY!,
      baseURL: "https://api.x.ai/v1",
    })(apiModelId);
  }

  throw new Error(`Provider not supported: ${provider}`);
}

