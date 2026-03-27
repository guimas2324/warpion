import { detectTaskType } from "@/lib/ai/task-detector";
import type { ChatMode } from "@/types/chat";
import type { SupabaseClient } from "@supabase/supabase-js";

type RouteParams = {
  mode: ChatMode;
  modelId?: string;
  message: string;
  supabase: SupabaseClient;
};

export async function resolveModelId({ mode, modelId, message, supabase }: RouteParams) {
  if (mode === "manual") {
    if (!modelId) throw new Error("model_id is required in manual mode");
    return { modelId, taskType: "general" as const, mode: "manual" as const };
  }

  const taskType = detectTaskType(message);
  const { data, error } = await supabase
    .from("task_model_map")
    .select("model_ids")
    .eq("task_type", taskType)
    .maybeSingle();

  if (error) throw error;

  const mapped = Array.isArray(data?.model_ids) ? (data.model_ids as string[]) : [];
  if (mapped.length === 0) {
    throw new Error(`No model mapping configured for task: ${taskType}`);
  }

  return { modelId: mapped[0], taskType, mode: "auto" as const };
}

