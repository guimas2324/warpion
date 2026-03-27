import type { TaskType } from "@/types/chat";

const TASK_RULES: Array<{ type: TaskType; regex: RegExp[] }> = [
  { type: "coding", regex: [/\b(code|bug|refactor|typescript|python|api|function|class)\b/i] },
  { type: "data_analysis", regex: [/\b(analyze|analysis|dataset|metrics|sql|query|trend)\b/i] },
  { type: "reasoning", regex: [/\b(reason|logic|prove|argument|hypothesis|decision)\b/i] },
  { type: "creative_writing", regex: [/\b(story|poem|creative|script|novel|tone)\b/i] },
  { type: "ui_design", regex: [/\b(ui|ux|design|layout|component|figma)\b/i] },
  { type: "spreadsheet", regex: [/\b(spreadsheet|excel|sheets|formula|pivot)\b/i] },
  { type: "asset_analysis", regex: [/\b(image|asset|screenshot|mockup|diagram)\b/i] },
  { type: "summarization", regex: [/\b(summarize|summary|tldr|recap)\b/i] },
  { type: "translation", regex: [/\b(translate|translation|portuguese|english|spanish)\b/i] },
  { type: "text_generation", regex: [/\b(write|draft|email|copy|post|article)\b/i] },
];

export function detectTaskType(input: string): TaskType {
  const text = input.trim();
  if (!text) return "general";

  for (const rule of TASK_RULES) {
    if (rule.regex.some((pattern) => pattern.test(text))) return rule.type;
  }

  return "general";
}

