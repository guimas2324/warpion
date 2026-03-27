import type { SupabaseClient } from "@supabase/supabase-js";
import type { TaskType } from "@/types/chat";

type SkillRow = {
  name: string;
  category: string;
  system_prompt: string | null;
  priority: number | null;
};

function taskTechniques(taskType: TaskType) {
  if (taskType === "coding") {
    return [
      "Prefer robust, maintainable solutions with clear trade-offs.",
      "Validate assumptions and call out edge cases explicitly.",
      "When proposing code, optimize for readability and production safety.",
    ];
  }
  if (taskType === "text_generation" || taskType === "creative_writing") {
    return [
      "Adapt tone to the apparent audience and intent.",
      "Keep structure clear with concise sections and outcomes.",
      "Avoid fluff; prioritize useful, concrete value.",
    ];
  }
  if (taskType === "data_analysis" || taskType === "spreadsheet") {
    return [
      "Show metrics, assumptions, and confidence level.",
      "Differentiate facts from hypotheses.",
      "Recommend next validation steps where uncertainty exists.",
    ];
  }
  return [
    "Be precise, practical, and safe.",
    "State assumptions when needed.",
    "Prefer concise answers with high signal.",
  ];
}

export async function buildArchitectedPrompt(params: {
  supabase: SupabaseClient;
  taskType: TaskType;
  complexity: number;
  message: string;
}): Promise<{ systemPrompt: string; selectedSkills: string[] }> {
  const { supabase, taskType, complexity, message } = params;
  const { data, error } = await supabase
    .from("skills")
    .select("name, category, system_prompt, priority")
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as SkillRow[];
  const coreSkills = rows.filter((row) => row.category === "core" && row.system_prompt);
  const taskSkills = rows.filter((row) => row.category === "task" && row.system_prompt);
  const advancedSkills = rows.filter((row) => row.category === "advanced" && row.system_prompt);
  const heavySkills = rows.filter((row) => row.category === "heavy" && row.system_prompt);

  const chosenTaskSkills =
    taskType === "coding"
      ? taskSkills.filter((row) => row.name.includes("code"))
      : taskType === "data_analysis"
        ? taskSkills.filter((row) => row.name.includes("data") || row.name.includes("research"))
        : taskType === "text_generation" || taskType === "creative_writing"
          ? taskSkills.filter((row) => row.name.includes("writer"))
          : taskSkills;

  const useAdvanced = complexity >= 3;
  const useHeavy = complexity >= 4;
  const selected = [
    ...coreSkills,
    ...chosenTaskSkills,
    ...(useAdvanced ? advancedSkills : []),
    ...(useHeavy ? heavySkills : []),
  ];

  const selectedSkills = selected.map((row) => row.name);
  const skillsPrompt = selected
    .map((row) => `- [${row.category}] ${row.name}: ${row.system_prompt ?? ""}`)
    .join("\n");

  const techniquesPrompt = taskTechniques(taskType).map((item) => `- ${item}`).join("\n");

  const systemPrompt = [
    "You are WARPION Chat Pro.",
    `Task type: ${taskType}`,
    `Complexity: ${complexity}/5`,
    "",
    "Active skills:",
    skillsPrompt || "- No active skills available.",
    "",
    "Task-specific techniques:",
    techniquesPrompt,
    "",
    "User request context:",
    message,
  ].join("\n");

  return { systemPrompt, selectedSkills };
}
