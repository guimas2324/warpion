"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatAttachment } from "@/types/chat";

export function InputBar({
  onSend,
  onStop,
  disabled,
  isStreaming,
  mode,
}: {
  onSend: (value: string, attachments: ChatAttachment[]) => void;
  onStop?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
  mode?: "manual" | "auto";
}) {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const charCount = value.length;
  const placeholder = useMemo(() => {
    if (mode === "auto") {
      return "Descreva o objetivo. O WARPION escolhe o melhor modelo...";
    }
    return "Pergunte ao WARPION (Enter envia, Shift+Enter nova linha)";
  }, [mode]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled || isStreaming) return;
    onSend(trimmed, attachments);
    setValue("");
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = "44px";
  }

  function resizeTextarea() {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    const maxHeight = 10 * 24;
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`;
  }

  function onTextareaChange(next: string) {
    setValue(next);
    requestAnimationFrame(resizeTextarea);
  }

  function onTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled || isStreaming) return;
    onSend(trimmed, attachments);
    setValue("");
    setAttachments([]);
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = "44px";
    });
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded: ChatAttachment[] = [];
      for (const file of files) {
        const data = new FormData();
        data.append("file", file);
        const res = await fetch("/api/uploads", { method: "POST", body: data });
        const json = (await res.json()) as { data?: ChatAttachment };
        if (res.ok && json.data) uploaded.push(json.data);
      }
      setAttachments((prev) => [...prev, ...uploaded]);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  useEffect(() => {
    const focusHandler = () => textareaRef.current?.focus();
    window.addEventListener("warpion:focus-input", focusHandler);
    return () => window.removeEventListener("warpion:focus-input", focusHandler);
  }, []);

  return (
    <form onSubmit={submit} className="flex gap-2">
      <div className="flex flex-1 flex-col gap-2">
        {!!attachments.length && (
          <div className="flex flex-wrap gap-1">
            {attachments.map((a) => (
              <span key={a.path} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-900">
                {a.name}
              </span>
            ))}
          </div>
        )}
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onTextareaChange(e.target.value)}
          onKeyDown={onTextareaKeyDown}
          className="min-h-11 w-full resize-none overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
          placeholder={placeholder}
        />
        {charCount > 500 ? (
          <div className="text-right text-xs text-zinc-500">{charCount.toLocaleString()} chars</div>
        ) : null}
      </div>
      <label className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-zinc-700 px-3 text-sm text-zinc-200 hover:bg-zinc-900/50">
        📎
        <input type="file" className="hidden" multiple onChange={onFileChange} />
      </label>
      {isStreaming ? (
        <button
          type="button"
          onClick={onStop}
          className="h-11 rounded-xl border border-red-500/60 px-3 text-sm font-medium text-red-300 hover:bg-red-500/10"
        >
          Stop
        </button>
      ) : null}
      <button
        type="submit"
        disabled={disabled || uploading || isStreaming}
        className="h-11 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white disabled:opacity-60"
      >
        {uploading ? "Uploading..." : "Send"}
      </button>
    </form>
  );
}

