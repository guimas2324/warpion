"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ModeToggle } from "@/components/chat/ModeToggle";
import { ModelSelector } from "@/components/chat/ModelSelector";
import { InputBar } from "@/components/chat/InputBar";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ImageGenerationCard } from "@/components/chat/ImageGenerationCard";
import { MediaToolbar } from "@/components/chat/MediaToolbar";
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
type PlanDTO = { tokens_monthly?: number };
type ProfileSummaryDTO = {
  tokens_remaining: number;
  tokens_used_total?: number;
  plans?: PlanDTO | PlanDTO[];
};
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
  const setTokensUsedTotal = useChatStore((s) => s.setTokensUsedTotal);
  const setModels = useModelStore((s) => s.setModels);
  const [lastPrompt, setLastPrompt] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [audioByMessageId, setAudioByMessageId] = useState<Record<string, string>>({});
  const [planTokensMonthly, setPlanTokensMonthly] = useState<number>(0);
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
      const raw = (err.message ?? "").toLowerCase();
      if (
        raw.includes("insufficient") ||
        raw.includes("402") ||
        raw.includes("token")
      ) {
        setError("tokens_depleted");
        return;
      }
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
        const json = (await profileRes.json()) as { data: ProfileSummaryDTO };
        setTokensRemaining(Number(json.data?.tokens_remaining ?? 0));
        setTokensUsedTotal(Number(json.data?.tokens_used_total ?? 0));
        const rawPlan = json.data?.plans;
        const resolvedPlan = Array.isArray(rawPlan) ? rawPlan[0] : rawPlan;
        setPlanTokensMonthly(Number(resolvedPlan?.tokens_monthly ?? 0));
      }
    }
    void load();
  }, [setConversations, setModels, setTokensRemaining, setTokensUsedTotal]);

  useEffect(() => {
    async function loadConversationMessages() {
      if (!selectedConversationId) {
        setMessages([]);
        return;
      }
      try {
        const res = await fetch(`/api/conversations/${selectedConversationId}/messages`);
        if (!res.ok) {
          setMessages([]);
          setError("Falha ao carregar mensagens da conversa.");
          return;
        }
        const json = (await res.json()) as { data: ConversationMessageDTO[] };
        setError("");
        setMessages(
          (json.data ?? []).map((m) => ({
            id: m.id,
            role: m.role,
            parts: [{ type: "text" as const, text: m.content }],
            metadata: {
              ...(m.metadata ?? {}),
              provider: m.provider ?? undefined,
              model: m.model ?? undefined,
              tokens_input: Number(m.tokens_input ?? 0),
              tokens_output: Number(m.tokens_output ?? 0),
              attachments: m.attachments ?? [],
            },
          })),
        );
      } catch (error) {
        setMessages([]);
        setError(error instanceof Error ? error.message : "Falha ao carregar mensagens da conversa.");
      }
    }
    void loadConversationMessages();
  }, [selectedConversationId, setMessages]);

  useEffect(() => {
    async function refreshConversationsAndTokens() {
      if (status !== "ready") return;
      const [convRes, profileRes] = await Promise.all([
        fetch("/api/conversations"),
        fetch("/api/profile/summary", { cache: "no-store" }),
      ]);
      if (convRes.ok) {
        const json = (await convRes.json()) as { data: ConversationDTO[] };
        setConversations(json.data ?? []);
      }
      if (profileRes.ok) {
        const json = (await profileRes.json()) as { data: ProfileSummaryDTO };
        setTokensRemaining(Number(json.data?.tokens_remaining ?? 0));
        setTokensUsedTotal(Number(json.data?.tokens_used_total ?? 0));
        const rawPlan = json.data?.plans;
        const resolvedPlan = Array.isArray(rawPlan) ? rawPlan[0] : rawPlan;
        setPlanTokensMonthly(Number(resolvedPlan?.tokens_monthly ?? 0));
      }
    }
    void refreshConversationsAndTokens();
  }, [messages.length, setConversations, setTokensRemaining, setTokensUsedTotal, status]);

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
        window.dispatchEvent(new Event("warpion:focus-input"));
      }
      if (event.key === "Escape") {
        stop();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setMessages, setSelectedConversationId, stop]);

  useEffect(() => {
    const handler = () => {
      setSelectedConversationId(undefined);
      setMessages([]);
      window.dispatchEvent(new Event("warpion:focus-input"));
    };
    window.addEventListener("warpion:new-chat", handler);
    return () => window.removeEventListener("warpion:new-chat", handler);
  }, [setMessages, setSelectedConversationId]);

  const monthlyBase = Math.max(1, planTokensMonthly || tokensRemaining + 1);
  const lowThreshold = Math.floor(monthlyBase * 0.1);
  const lowPct = Math.max(0, Math.min(100, Math.round((tokensRemaining / monthlyBase) * 100)));

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ModeToggle />
          <ModelSelector autoDetails={latestAutoInfo} />
        </div>
      </div>
      <MediaToolbar
        onGenerateImage={() => {
          const prompt = window.prompt("Prompt da imagem:");
          if (!prompt) return;
          setLastPrompt(`/image ${prompt}`);
          setError("");
          setMessages([
            ...messages,
            { id: `img-user-${Date.now()}`, role: "user", parts: [{ type: "text", text: `/image ${prompt}` }] },
          ]);
          void (async () => {
            try {
              const response = await fetch("/api/media/image", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ prompt, model: "gpt-image" }),
              });
              const payload = (await response.json()) as {
                data?: { url?: string; model?: string; prompt?: string };
                error?: string;
              };
              if (!response.ok || !payload.data?.url || !payload.data.model) {
                setError(payload.error ?? "Falha ao gerar imagem.");
                return;
              }
              const imageData = payload.data;
              setMessages((prev) => [
                ...prev,
                {
                  id: `img-assistant-${Date.now()}`,
                  role: "assistant",
                  parts: [{ type: "text", text: "Imagem gerada com sucesso." }],
                  metadata: {
                    generated_image_url: imageData.url,
                    generated_image_model: imageData.model,
                    generated_image_prompt: imageData.prompt ?? prompt,
                  },
                },
              ]);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Falha ao gerar imagem.");
            }
          })();
        }}
        onGenerateAudio={() => {
          const text = window.prompt("Texto para gerar audio:");
          if (!text) return;
          void (async () => {
            try {
              const response = await fetch("/api/media/tts", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ text, model: "openai-tts", voice: "nova" }),
              });
              const payload = (await response.json()) as {
                data?: { url?: string; model?: string; voice?: string };
                error?: string;
              };
              if (!response.ok || !payload.data?.url) {
                setError(payload.error ?? "Falha ao gerar audio.");
                return;
              }
              setMessages((prev) => [
                ...prev,
                {
                  id: `tts-assistant-${Date.now()}`,
                  role: "assistant",
                  parts: [{ type: "text", text: "Audio gerado com sucesso." }],
                  metadata: {
                    generated_audio_url: payload.data?.url,
                    generated_audio_model: payload.data?.model,
                    generated_audio_voice: payload.data?.voice,
                  },
                },
              ]);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Falha ao gerar audio.");
            }
          })();
        }}
      />

      <div ref={scrollRef} className="mb-3 flex-1 space-y-3 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-950/50 p-3">
        {messages.map((m: UIMessage) => {
          const meta = (m.metadata ?? {}) as Record<string, unknown>;
          const generatedImageUrl = typeof meta.generated_image_url === "string" ? meta.generated_image_url : undefined;
          const generatedImageModel = typeof meta.generated_image_model === "string" ? meta.generated_image_model : undefined;
          const generatedImagePrompt = typeof meta.generated_image_prompt === "string" ? meta.generated_image_prompt : undefined;
          const generatedAudioUrl = typeof meta.generated_audio_url === "string" ? meta.generated_audio_url : undefined;
          const visionWarning = typeof meta.vision_warning === "string" ? meta.vision_warning : undefined;
          if (m.role === "assistant" && generatedImageUrl && generatedImageModel) {
            return (
              <div key={m.id} className="flex justify-start">
                <ImageGenerationCard
                  imageUrl={generatedImageUrl}
                  model={generatedImageModel}
                  prompt={generatedImagePrompt}
                />
              </div>
            );
          }
          return (
            <div key={m.id} className="space-y-1">
              {m.role === "assistant" && visionWarning ? (
                <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-2 py-1 text-xs text-amber-200">
                  {visionWarning}
                </div>
              ) : null}
              <MessageBubble
                role={m.role as "user" | "assistant"}
                content={getMessageText(m)}
                provider={typeof meta.provider === "string" ? meta.provider : undefined}
                model={typeof meta.model === "string" ? meta.model : undefined}
                tokens={Number(meta.tokens_input ?? 0) + Number(meta.tokens_output ?? 0)}
                tokensInput={Number(meta.tokens_input ?? 0)}
                tokensOutput={Number(meta.tokens_output ?? 0)}
                audioUrl={audioByMessageId[m.id] ?? generatedAudioUrl}
                onSpeak={
                  m.role === "assistant"
                    ? () => {
                        const existing = audioByMessageId[m.id];
                        if (existing) return;
                        void (async () => {
                          try {
                            const response = await fetch("/api/media/tts", {
                              method: "POST",
                              headers: { "content-type": "application/json" },
                              body: JSON.stringify({ text: getMessageText(m), model: "openai-tts", voice: "nova" }),
                            });
                            const payload = (await response.json()) as { data?: { url?: string }; error?: string };
                            if (!response.ok || !payload.data?.url) {
                              setError(payload.error ?? "Falha ao gerar audio.");
                              return;
                            }
                            setAudioByMessageId((prev) => ({ ...prev, [m.id]: payload.data?.url ?? "" }));
                          } catch (err) {
                            setError(err instanceof Error ? err.message : "Falha ao gerar audio.");
                          }
                        })();
                      }
                    : undefined
                }
                attachments={Array.isArray(meta.attachments) ? (meta.attachments as ChatAttachment[]) : undefined}
                onRegenerate={
                  m.role === "assistant" && lastPrompt
                    ? () => sendMessage({ text: lastPrompt }, { body })
                    : undefined
                }
              />
            </div>
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
                "[Code] Refatore este trecho TypeScript com foco em performance",
                "[Plan] Crie um plano de execucao para uma API em 3 fases",
                "[Data] Analise estes requisitos e aponte riscos tecnicos",
                "[Write] Escreva um resumo executivo em portugues",
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
      {error === "tokens_depleted" ? (
        <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          <span>Seus tokens acabaram. Faça upgrade do plano ou compre tokens extras.</span>
          <div className="flex gap-2">
            <button onClick={() => (window.location.href = "/settings?tab=plan")} className="rounded-lg border border-red-400/60 px-2 py-1 text-xs hover:bg-red-500/10">
              Fazer Upgrade
            </button>
            <button onClick={() => (window.location.href = "/settings?tab=plan#tokens")} className="rounded-lg border border-red-400/60 px-2 py-1 text-xs hover:bg-red-500/10">
              Comprar Tokens
            </button>
          </div>
        </div>
      ) : null}
      {error && error !== "tokens_depleted" ? <div className="mb-2 text-sm text-red-500">{error}</div> : null}
      {tokensRemaining > 0 && tokensRemaining <= lowThreshold ? (
        <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-amber-500/60 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          <span>
            Restam apenas {tokensRemaining.toLocaleString("pt-BR")} tokens ({lowPct}%). Considere fazer upgrade.
          </span>
          <button onClick={() => (window.location.href = "/settings?tab=plan")} className="rounded-lg border border-amber-400/60 px-2 py-1 text-xs hover:bg-amber-500/10">
            Ver Planos
          </button>
        </div>
      ) : null}

      <InputBar
        disabled={status === "streaming" || tokensRemaining <= 0 || error === "tokens_depleted"}
        isStreaming={status === "streaming" || status === "submitted"}
        mode={mode}
        tokensDepleted={tokensRemaining <= 0 || error === "tokens_depleted"}
        onStop={() => {
          stop();
        }}
        onSend={(value, attachments) => {
          setLastPrompt(value);
          setError("");
          if (value.toLowerCase().startsWith("/image ")) {
            const prompt = value.slice(7).trim();
            if (!prompt) {
              setError("Prompt de imagem vazio. Use: /image seu prompt");
              return;
            }
            setMessages([
              ...messages,
              { id: `img-user-${Date.now()}`, role: "user", parts: [{ type: "text", text: value }] },
            ]);
            void (async () => {
              try {
                const response = await fetch("/api/media/image", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ prompt, model: "gpt-image" }),
                });
                const payload = (await response.json()) as {
                  data?: { url?: string; model?: string; prompt?: string };
                  error?: string;
                };
                if (!response.ok || !payload.data?.url || !payload.data.model) {
                  setError(payload.error ?? "Falha ao gerar imagem.");
                  return;
                }
                const imageData = payload.data;
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `img-assistant-${Date.now()}`,
                    role: "assistant",
                    parts: [{ type: "text", text: "Imagem gerada com sucesso." }],
                    metadata: {
                      generated_image_url: imageData.url,
                      generated_image_model: imageData.model,
                      generated_image_prompt: imageData.prompt ?? prompt,
                    },
                  },
                ]);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Falha ao gerar imagem.");
              }
            })();
            return;
          }
          sendMessage({ text: value }, { body: { ...body, attachments } });
        }}
      />
      {tokensRemaining <= 0 ? <div className="mt-2 text-xs text-red-300">Tokens esgotados.</div> : null}
    </div>
  );
}

