"use client";

import { useEffect, useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { ModeToggle } from "@/components/chat/ModeToggle";
import { ModelSelector } from "@/components/chat/ModelSelector";
import { InputBar } from "@/components/chat/InputBar";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { useChatStore } from "@/stores/chat-store";
import { useModelStore } from "@/stores/model-store";
import type { ChatAttachment } from "@/types/chat";

type ConversationDTO = { id: string; title: string; updated_at?: string; created_at?: string };
type ModelDTO = {
  id: string;
  display_name: string;
  provider: string;
  litellm_id: string | null;
  is_active: boolean;
  description: string | null;
  supports_streaming: boolean | null;
  supports_vision: boolean | null;
  supports_tools: boolean | null;
  speed_tier: "fast" | "normal" | "slow" | null;
};
type ProfileDTO = { tokens_remaining: number };
type ConversationMessageDTO = { id: string; role: "user" | "assistant" | "system"; content: string; attachments?: ChatAttachment[] };

export function ChatPanel() {
  const mode = useChatStore((s) => s.mode);
  const modelId = useChatStore((s) => s.modelId);
  const selectedConversationId = useChatStore((s) => s.selectedConversationId);
  const setSelectedConversationId = useChatStore((s) => s.setSelectedConversationId);
  const setConversations = useChatStore((s) => s.setConversations);
  const tokensRemaining = useChatStore((s) => s.tokensRemaining);
  const setTokensRemaining = useChatStore((s) => s.setTokensRemaining);
  const setModels = useModelStore((s) => s.setModels);
  const [lastSelectedModel, setLastSelectedModel] = useState<string>("");
  const [lastPrompt, setLastPrompt] = useState<string>("");
  const [error, setError] = useState<string>("");

  const body = useMemo(
    () => ({
      mode,
      model_id: mode === "manual" ? modelId : undefined,
      conversation_id: selectedConversationId,
    }),
    [mode, modelId, selectedConversationId],
  );

  const { messages, append, setMessages, status } = useChat({
    api: "/api/chat",
    body,
    onError(err) {
      setError(err.message);
    },
    onResponse(response) {
      const conv = response.headers.get("x-conversation-id");
      const selected = response.headers.get("x-selected-model");
      if (conv && !selectedConversationId) setSelectedConversationId(conv);
      if (selected) setLastSelectedModel(selected);
    },
  });

  useEffect(() => {
    async function load() {
      const [modelsRes, convRes, profileRes] = await Promise.all([
        fetch("/api/models"),
        fetch("/api/conversations"),
        fetch("/api/profile/summary"),
      ]);
      if (modelsRes.ok) {
        const json = (await modelsRes.json()) as { data: ModelDTO[] };
        setModels(json.data ?? []);
      }
      if (convRes.ok) {
        const json = (await convRes.json()) as { data: ConversationDTO[] };
        setConversations(json.data ?? []);
      }
      if (profileRes.ok) {
        const json = (await profileRes.json()) as { data: ProfileDTO };
        setTokensRemaining(Number(json.data?.tokens_remaining ?? 0));
      }
    }
    void load();
  }, [setConversations, setModels, setTokensRemaining]);

  useEffect(() => {
    async function loadConversationMessages() {
      if (!selectedConversationId) {
        setMessages([]);
        return;
      }
      const res = await fetch(`/api/conversations/${selectedConversationId}/messages`);
      if (!res.ok) return;
      const json = (await res.json()) as { data: ConversationMessageDTO[] };
      setMessages(
        (json.data ?? []).map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        })),
      );
    }
    void loadConversationMessages();
  }, [selectedConversationId, setMessages]);

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ModeToggle />
          <ModelSelector />
        </div>
        {mode === "auto" && lastSelectedModel ? (
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
            Selected: {lastSelectedModel}
          </span>
        ) : null}
      </div>

      <div className="mb-3 flex-1 space-y-3 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-black">
        {messages.map((m: UIMessage) => (
          <MessageBubble
            key={m.id}
            role={m.role as "user" | "assistant"}
            content={m.content}
            onRegenerate={
              m.role === "assistant" && lastPrompt
                ? () => append({ role: "user", content: lastPrompt })
                : undefined
            }
          />
        ))}
        {status === "streaming" ? <div className="text-sm text-zinc-500">Thinking...</div> : null}
        {messages.length === 0 ? <div className="text-sm text-zinc-500">Start a conversation...</div> : null}
      </div>
      {error ? <div className="mb-2 text-sm text-red-500">{error}</div> : null}

      <InputBar
        disabled={status === "streaming" || tokensRemaining <= 0}
        onSend={(value, attachments) => {
          setLastPrompt(value);
          setError("");
          append({ role: "user", content: value }, { body: { ...body, attachments } });
        }}
      />
      {tokensRemaining <= 0 ? <div className="mt-2 text-xs text-amber-600">Sem tokens restantes. Faça upgrade no plano.</div> : null}
    </div>
  );
}

