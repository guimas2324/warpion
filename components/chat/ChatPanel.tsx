"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
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
  model_type: string;
  token_multiplier: number | null;
  description: string | null;
  supports_streaming: boolean | null;
  supports_vision: boolean | null;
  supports_tools: boolean | null;
  speed_tier: "fast" | "normal" | "slow" | null;
};
type ProfileDTO = { tokens_remaining: number };
type ConversationMessageDTO = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: ChatAttachment[];
  model?: string | null;
  provider?: string | null;
  tokens_input?: number | null;
  tokens_output?: number | null;
  metadata?: Record<string, unknown> | null;
};

function getMessageText(message: UIMessage) {
  return (message.parts ?? [])
    .filter((part) => part.type === "text")
    .map((part) => ("text" in part ? part.text : ""))
    .join("");
}

export function ChatPanel() {
  const mode = useChatStore((s) => s.mode);
  const modelId = useChatStore((s) => s.modelId);
  const selectedConversationId = useChatStore((s) => s.selectedConversationId);
  const setSelectedConversationId = useChatStore((s) => s.setSelectedConversationId);
  const setConversations = useChatStore((s) => s.setConversations);
  const tokensRemaining = useChatStore((s) => s.tokensRemaining);
  const setTokensRemaining = useChatStore((s) => s.setTokensRemaining);
  const setModels = useModelStore((s) => s.setModels);
  const [lastPrompt, setLastPrompt] = useState<string>("");
  const [error, setError] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const body = useMemo(
    () => ({
      mode,
      model_id: mode === "manual" ? modelId : undefined,
      conversation_id: selectedConversationId,
    }),
    [mode, modelId, selectedConversationId],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body,
      }),
    [body],
  );

  const { messages, sendMessage, setMessages, status, stop } = useChat({
    transport,
    onError(err) {
      setError(err.message);
    },
  });

  const latestAutoInfo = useMemo(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (!lastAssistant) return undefined;
    const meta = (lastAssistant.metadata ?? {}) as Record<string, unknown>;
    const model = typeof meta.model === "string" ? meta.model : undefined;
    const taskType = typeof meta.routed_task_type === "string" ? meta.routed_task_type : undefined;
    if (!model) return undefined;
    return { model, taskType };
  }, [messages]);

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
          parts: [{ type: "text" as const, text: m.content }],
          metadata: {
            provider: m.provider ?? undefined,
            model: m.model ?? undefined,
            tokens_input: Number(m.tokens_input ?? 0),
            tokens_output: Number(m.tokens_output ?? 0),
            attachments: m.attachments ?? [],
          },
        })),
      );
    }
    void loadConversationMessages();
  }, [selectedConversationId, setMessages]);

  useEffect(() => {
    async function refreshConversations() {
      if (status !== "ready") return;
      const res = await fetch("/api/conversations");
      if (!res.ok) return;
      const json = (await res.json()) as { data: ConversationDTO[] };
      setConversations(json.data ?? []);
    }
    void refreshConversations();
  }, [messages.length, setConversations, status]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const nearBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 80;
    if (nearBottom || status === "streaming" || status === "submitted") {
      node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
    }
  }, [messages, status]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const onScroll = () => {
      const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
      setShowScrollToBottom(distance > 140);
    };
    node.addEventListener("scroll", onScroll);
    onScroll();
    return () => node.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "n") {
        event.preventDefault();
        setSelectedConversationId(undefined);
        setMessages([]);
      }
      if (event.key === "Escape") {
        stop();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setMessages, setSelectedConversationId, stop]);

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ModeToggle />
          <ModelSelector autoDetails={latestAutoInfo} />
        </div>
      </div>

      <div ref={scrollRef} className="mb-3 flex-1 space-y-3 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-950/50 p-3">
        {messages.map((m: UIMessage) => {
          const meta = (m.metadata ?? {}) as Record<string, unknown>;
          return (
            <MessageBubble
              key={m.id}
              role={m.role as "user" | "assistant"}
              content={getMessageText(m)}
              provider={typeof meta.provider === "string" ? meta.provider : undefined}
              model={typeof meta.model === "string" ? meta.model : undefined}
              tokens={Number(meta.tokens_input ?? 0) + Number(meta.tokens_output ?? 0)}
              attachments={Array.isArray(meta.attachments) ? (meta.attachments as ChatAttachment[]) : undefined}
              onRegenerate={
                m.role === "assistant" && lastPrompt
                  ? () => sendMessage({ text: lastPrompt }, { body })
                  : undefined
              }
            />
          );
        })}
        {(status === "submitted" || status === "streaming") ? (
          <MessageBubble
            role="assistant"
            content=""
            model={mode === "manual" ? modelId : "auto"}
            thinkingPhase={status === "submitted" ? "Analisando..." : `${mode === "manual" ? modelId : "Warpion"} gerando...`}
          />
        ) : null}
        {messages.length === 0 ? (
          <div className="rounded-xl border border-zinc-700 bg-zinc-900/40 p-5 text-center">
            <div className="mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-xl font-extrabold text-transparent">
              WARPION
            </div>
            <div className="mb-4 text-sm text-zinc-400">Como posso ajudar?</div>
            <div className="grid gap-2 md:grid-cols-2">
              {[
                "Refatore este trecho TypeScript com foco em performance",
                "Crie um plano de execucao para uma API em 3 fases",
                "Analise estes requisitos e aponte riscos tecnicos",
                "Escreva um resumo executivo em portugues",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setLastPrompt(suggestion);
                    sendMessage({ text: suggestion }, { body });
                  }}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-800"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      {showScrollToBottom ? (
        <div className="-mt-1 mb-2 flex justify-end">
          <button
            onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })}
            className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-200 hover:bg-zinc-800"
          >
            ↓ Voltar ao fim
          </button>
        </div>
      ) : null}
      {error ? <div className="mb-2 text-sm text-red-500">{error}</div> : null}

      <InputBar
        disabled={status === "streaming" || tokensRemaining <= 0}
        isStreaming={status === "streaming" || status === "submitted"}
        mode={mode}
        onStop={() => {
          stop();
        }}
        onSend={(value, attachments) => {
          setLastPrompt(value);
          setError("");
          sendMessage({ text: value }, { body: { ...body, attachments } });
        }}
      />
      {tokensRemaining <= 0 ? <div className="mt-2 text-xs text-amber-600">Sem tokens restantes. Faça upgrade no plano.</div> : null}
    </div>
  );
}

