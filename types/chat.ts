export type ChatMode = "manual" | "auto";

export type TaskType =
  | "coding"
  | "text_generation"
  | "data_analysis"
  | "reasoning"
  | "creative_writing"
  | "ui_design"
  | "spreadsheet"
  | "asset_analysis"
  | "summarization"
  | "translation"
  | "general";

export type UiChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
  attachments?: ChatAttachment[];
};

export type ChatAttachment = {
  name: string;
  path: string;
  mimeType: string;
  size: number;
  publicUrl?: string;
};

export type ChatRequestPayload = {
  message: string;
  mode: ChatMode;
  model_id?: string;
  conversation_id?: string;
  history: UiChatMessage[];
  attachments?: ChatAttachment[];
};

