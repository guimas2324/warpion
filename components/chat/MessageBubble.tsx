"use client";

import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import type { ChatAttachment } from "@/types/chat";
import { AudioPlayer } from "@/components/chat/AudioPlayer";

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
  const userInitials = "U";
  const providerInitials = providerLabel.slice(0, 2);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} items-end gap-2`}>
      {!isUser ? (
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-xs font-semibold text-indigo-300">
          {providerInitials}
        </div>
      ) : null}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
          isUser
            ? "bg-zinc-800 text-zinc-100"
            : "border border-zinc-700 bg-zinc-950 text-zinc-100"
        }`}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-100">
              {isUser ? `USER ${userInitials}` : providerLabel}
            </span>
            {!isUser && model ? (
              <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-indigo-200">
                {model}
              </span>
            ) : null}
            {!isUser && typeof tokens === "number" ? (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200">
                {tokens.toLocaleString()} tokens
              </span>
            ) : null}
          </div>
        </div>

        {isUser ? <div className="whitespace-pre-wrap">{content}</div> : <MarkdownRenderer content={content} />}
        {!!attachments?.length && (
          <div className="mt-2 space-y-2 text-xs text-zinc-300">
            {attachments.map((a) => (
              <div key={a.path}>
                {a.mimeType.startsWith("image/") && a.publicUrl ? (
                  <a href={a.publicUrl} target="_blank" rel="noreferrer" className="inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.publicUrl}
                      alt={a.name}
                      className="max-h-[320px] max-w-[400px] rounded-lg border border-zinc-700 object-contain"
                    />
                  </a>
                ) : (
                  <a
                    href={a.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/50 px-2 py-1 underline underline-offset-2 hover:text-indigo-300"
                  >
                    <span>📄</span>
                    <span className="truncate">{a.name}</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
        {!isUser && thinkingPhase ? (
          <div className="mt-2 rounded-lg border border-zinc-700 bg-zinc-900/50 px-2 py-1 text-xs text-zinc-300">
            {thinkingPhase}
          </div>
        ) : null}
        {!isUser && typeof tokensInput === "number" && typeof tokensOutput === "number" ? (
          <div className="mt-2 text-[11px] text-zinc-400">
            ↑{tokensInput.toLocaleString("pt-BR")} ↓{tokensOutput.toLocaleString("pt-BR")} tokens
            {model ? ` • via ${model}` : ""}
          </div>
        ) : null}
        {!isUser && audioUrl ? <AudioPlayer url={audioUrl} /> : null}
        {!isUser && (
          <div className="mt-3 flex gap-2 text-xs">
            <button onClick={() => navigator.clipboard.writeText(content)} className="rounded border border-zinc-600 px-2 py-0.5 hover:bg-zinc-800">
              Copy
            </button>
            {onRegenerate ? (
              <button onClick={onRegenerate} className="rounded border border-zinc-600 px-2 py-0.5 hover:bg-zinc-800">
                Regenerate
              </button>
            ) : null}
            {onSpeak ? (
              <button onClick={onSpeak} className="rounded border border-zinc-600 px-2 py-0.5 hover:bg-zinc-800">
                🔊 Ouvir
              </button>
            ) : null}
            <button className="rounded border border-zinc-600 px-2 py-0.5 hover:bg-zinc-800">👍</button>
            <button className="rounded border border-zinc-600 px-2 py-0.5 hover:bg-zinc-800">👎</button>
          </div>
        )}
      </div>
      {isUser ? (
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-600 bg-zinc-700 text-xs font-semibold text-zinc-100">
          {userInitials}
        </div>
      ) : null}
    </div>
  );
}

