"use client";

import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import type { ChatAttachment } from "@/types/chat";

export function MessageBubble({
  role,
  content,
  attachments,
  onRegenerate,
}: {
  role: "user" | "assistant";
  content: string;
  attachments?: ChatAttachment[];
  onRegenerate?: () => void;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
          isUser
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
        }`}
      >
        {isUser ? <div className="whitespace-pre-wrap">{content}</div> : <MarkdownRenderer content={content} />}
        {!!attachments?.length && (
          <div className="mt-2 space-y-1 text-xs">
            {attachments.map((a) => (
              <a key={a.path} href={a.publicUrl} target="_blank" rel="noreferrer" className="block underline underline-offset-2">
                {a.name}
              </a>
            ))}
          </div>
        )}
        {!isUser && (
          <div className="mt-2 flex gap-2 text-xs">
            <button onClick={() => navigator.clipboard.writeText(content)} className="rounded border px-2 py-0.5">
              Copy
            </button>
            {onRegenerate ? (
              <button onClick={onRegenerate} className="rounded border px-2 py-0.5">
                Regenerate
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

