"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ChatMode } from "@/types/chat";

type ConversationItem = {
  id: string;
  title: string;
  preview?: string;
  model_used?: string | null;
  provider?: string | null;
  last_message_at?: string;
  updated_at?: string;
  created_at?: string;
};

type ChatStore = {
  mode: ChatMode;
  modelId?: string;
  selectedConversationId?: string;
  conversations: ConversationItem[];
  tokensRemaining: number;
  tokensUsedTotal: number;
  setMode: (mode: ChatMode) => void;
  setModelId: (modelId?: string) => void;
  setSelectedConversationId: (id?: string) => void;
  setConversations: (items: ConversationItem[]) => void;
  setTokensRemaining: (value: number) => void;
  setTokensUsedTotal: (value: number) => void;
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      mode: "auto",
      modelId: undefined,
      selectedConversationId: undefined,
      conversations: [],
      tokensRemaining: 0,
      tokensUsedTotal: 0,
      setMode: (mode) => set({ mode }),
      setModelId: (modelId) => set({ modelId }),
      setSelectedConversationId: (selectedConversationId) => set({ selectedConversationId }),
      setConversations: (conversations) => set({ conversations }),
      setTokensRemaining: (tokensRemaining) => set({ tokensRemaining }),
      setTokensUsedTotal: (tokensUsedTotal) => set({ tokensUsedTotal }),
    }),
    {
      name: "warpion-chat-prefs",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        mode: state.mode,
        modelId: state.modelId,
      }),
    },
  ),
);

