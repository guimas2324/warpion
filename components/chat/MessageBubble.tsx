"use client";

import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import type { ChatAttachment } from "@/types/chat";
import { AudioPlayer } from "@/components/chat/AudioPlayer";
import { Copy, RefreshCw, Volume2, ThumbsUp, ThumbsDown, FileText } from "lucide-react";

export function MessageBubble({
  role,
  content,
  attachments,
  provider,
  model,
  tokens,
  tokensInput,
  tokensOutput,
  audioUrl,
  onSpeak,
  thinkingPhase,
  onRegenerate,
}: {
  role: "user" | "assistant";
  content: string;
  attachments?: ChatAttachment[];
  provider?: string;
  model?: string;
  tokens?: number;
  tokensInput?: number;
  tokensOutput?: number;
  audioUrl?: string;
  onSpeak?: () => void;
  thinkingPhase?: string;
  onRegenerate?: () => void;
}) {
  const isUser = role === "user";
  const providerLabel = provider?.toUpperCase() ?? "WARPION";

  return (
    <article className="group w-full py-6">
      <div className="mx-auto max-w-[900px] px-4 md:px-6">
        {isUser ? (
          <div className="flex justify-end">
            <div className="max-w-[780px] text-right text-[15px] leading-7 text-zinc-200">{content}</div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
              <span>{providerLabel}</span>
              {model ? <span>· {model}</span> : null}
            </div>
            <div className="max-w-[780px] text-[15px] leading-7 text-zinc-200">
              <MarkdownRenderer content={content} />
            </div>
          </div>
        )}

        {!!attachments?.length ? (
          <div className={`mt-3 space-y-2 ${isUser ? "flex flex-col items-end" : ""}`}>
            {attachments.map((a) =>
              a.mimeType.startsWith("image/") && a.publicUrl ? (
                <a key={a.path} href={a.publicUrl} target="_blank" rel="noreferrer" className="inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.publicUrl}
                    alt={a.name}
                    className="max-h-[320px] max-w-[480px] rounded-xl border border-zinc-800 object-contain"
                  />
                </a>
              ) : (
                <a
                  key={a.path}
                  href={a.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-zinc-100"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span className="truncate">{a.name}</span>
                </a>
              ),
            )}
          </div>
        ) : null}

        {!isUser && thinkingPhase ? (
          <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-xs text-zinc-400">
            {thinkingPhase}
          </div>
        ) : null}

        {!isUser && typeof tokensInput === "number" && typeof tokensOutput === "number" ? (
          <div className="mt-4 text-[11px] text-zinc-500">
            ↑{tokensInput.toLocaleString("pt-BR")} ↓{tokensOutput.toLocaleString("pt-BR")} tokens
            {typeof tokens === "number" ? ` • total ${tokens.toLocaleString("pt-BR")}` : ""}
            {model ? ` • via ${model}` : ""}
          </div>
        ) : null}

        {!isUser && audioUrl ? <AudioPlayer url={audioUrl} /> : null}

        {!isUser && (
          <div className="mt-3 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <button
              onClick={() => navigator.clipboard.writeText(content)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </button>
            {onRegenerate ? (
              <button
                onClick={onRegenerate}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate
              </button>
            ) : null}
            {onSpeak ? (
              <button
                onClick={onSpeak}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
              >
                <Volume2 className="h-3.5 w-3.5" />
                Ouvir
              </button>
            ) : null}
            <button className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300">
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300">
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

