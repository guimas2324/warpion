import { generateText } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getProviderModel } from "@/lib/ai/providers";
import type { TaskType } from "@/types/chat";

export type QualityGateResult = {
  passed: boolean;
  issues: string[];
  completeness: number;
  suggestion: string;
};

const CHEAP_MODEL_PREFERENCE = ["claude-haiku-4-5", "gemini-3-flash", "deepseek-v3.2"];

function parseQualityJson(raw: string): Partial<QualityGateResult> {
  const match = raw.trim().match(/\{[\s\S]*\}/);
  if (!match) return {};
  try {
    return JSON.parse(match[0]) as Partial<QualityGateResult>;
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

export async function runQualityGate(params: {
  supabase: SupabaseClient;
  message: string;
  answer: string;
  taskType: TaskType;
}): Promise<QualityGateResult> {
  const { supabase, message, answer, taskType } = params;
  const cheap = await resolveCheapModel(supabase);
  if (!cheap) {
    return {
      passed: true,
      issues: [],
      completeness: 80,
      suggestion: "",
    };
  }

  const model = getProviderModel(cheap.provider, cheap.id);
  const prompt = [
    "You are WARPION Quality Gate (Layer 4).",
    "Assess the answer quality for the request and return ONLY JSON.",
    'Schema: {"passed":boolean,"issues":["string"],"completeness":0-100,"suggestion":"string"}',
    `Task type: ${taskType}`,
    `User message: ${message}`,
    `Assistant answer: ${answer}`,
  ].join("\n");

  try {
    const result = await generateText({
      model,
      prompt,
      maxOutputTokens: 160,
    });
    const parsed = parseQualityJson(result.text);
    const completeness = Math.max(0, Math.min(100, Number(parsed.completeness ?? 80)));
    return {
      passed: Boolean(parsed.passed ?? true),
      issues: Array.isArray(parsed.issues) ? parsed.issues.map(String) : [],
      completeness,
      suggestion: String(parsed.suggestion ?? ""),
    };
  } catch {
    return {
      passed: true,
      issues: [],
      completeness: 80,
      suggestion: "",
    };
  }
}
