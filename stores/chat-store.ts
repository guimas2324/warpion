"use client";

import { create } from "zustand";
import type { ChatMode } from "@/types/chat";

type ConversationItem = {
  id: string;
  title: string;
  updated_at?: string;
  created_at?: string;
};

type ChatStore = {
  mode: ChatMode;
  modelId?: string;
  selectedConversationId?: string;
  conversations: ConversationItem[];
  tokensRemaining: number;
  setMode: (mode: ChatMode) => void;
  setModelId: (modelId?: string) => void;
  setSelectedConversationId: (id?: string) => void;
  setConversations: (items: ConversationItem[]) => void;
  setTokensRemaining: (value: number) => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  mode: "auto",
  modelId: undefined,
  selectedConversationId: undefined,
  conversations: [],
  tokensRemaining: 0,
  setMode: (mode) => set({ mode }),
  setModelId: (modelId) => set({ modelId }),
  setSelectedConversationId: (selectedConversationId) => set({ selectedConversationId }),
  setConversations: (conversations) => set({ conversations }),
  setTokensRemaining: (tokensRemaining) => set({ tokensRemaining }),
}));

