import { generateText } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getProviderModel } from "@/lib/ai/providers";
import { detectTaskType } from "@/lib/ai/task-detector";
import type { ChatMode, TaskType } from "@/types/chat";

export type IntentDecoderResult = {
  task_type: TaskType;
  complexity: 1 | 2 | 3 | 4 | 5;
  ambiguous: boolean;
  recommended_model: string;
  reasoning: string;
};

const CHEAP_MODEL_PREFERENCE = ["claude-haiku-4-5", "gemini-3-flash", "deepseek-v3.2"];

function parseIntentJson(raw: string): Partial<IntentDecoderResult> {
  const trimmed = raw.trim();
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) return {};
  try {
    return JSON.parse(match[0]) as Partial<IntentDecoderResult>;
  } catch {
    return {};
  }
}

async function resolveCheapModel(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("model_catalog")
    .select("id, provider")
    .in("id", CHEAP_MODEL_PREFERENCE)
    .eq("is_active", true);

  const rows = (data ?? []) as Array<{ id: string; provider: string }>;
  for (const preferredId of CHEAP_MODEL_PREFERENCE) {
    const found = rows.find((row) => row.id === preferredId);
    if (found) return found;
  }
  return null;
}

export async function decodeIntent(params: {
  supabase: SupabaseClient;
  message: string;
  mode: ChatMode;
  selectedModelId?: string;
}): Promise<IntentDecoderResult> {
  const { supabase, message, mode, selectedModelId } = params;
  const cheap = await resolveCheapModel(supabase);
  const heuristicTask = detectTaskType(message);

  if (!cheap) {
    return {
      task_type: heuristicTask,
      complexity: message.length > 1200 ? 4 : 2,
      ambiguous: mode === "auto" && message.trim().length < 12,
      recommended_model: selectedModelId ?? "gemini-3-flash",
      reasoning: "Fallback heuristic path used because no cheap model is active.",
    };
  }

  const model = getProviderModel(cheap.provider, cheap.id);
  const prompt = [
    "You are the WARPION Intent Decoder (Layer 1).",
    "Analyze the user request and return ONLY valid JSON.",
    'Schema: {"task_type":"coding|text_generation|data_analysis|reasoning|creative_writing|ui_design|spreadsheet|asset_analysis|summarization|translation|general","complexity":1|2|3|4|5,"ambiguous":boolean,"recommended_model":"string","reasoning":"string"}',
    "Do not include markdown.",
    `Mode: ${mode}`,
    `Selected model (manual mode): ${selectedModelId ?? "none"}`,
    `User message: ${message}`,
  ].join("\n");

  try {
    const result = await generateText({
      model,
      prompt,
      maxOutputTokens: 140,
    });
    const parsed = parseIntentJson(result.text);
    const complexity = Math.max(1, Math.min(5, Number(parsed.complexity ?? 3))) as 1 | 2 | 3 | 4 | 5;

    return {
      task_type: (parsed.task_type as TaskType) ?? heuristicTask,
      complexity,
      ambiguous: Boolean(parsed.ambiguous),
      recommended_model: String(parsed.recommended_model ?? selectedModelId ?? cheap.id),
      reasoning: String(parsed.reasoning ?? "Decoded by cheap classifier model."),
    };
  } catch {
    return {
      task_type: heuristicTask,
      complexity: message.length > 1200 ? 4 : 2,
      ambiguous: false,
      recommended_model: selectedModelId ?? cheap?.id ?? "gemini-3-flash",
      reasoning: "Fallback: decoder failed, using heuristic + safe default model.",
    };
  }
}
