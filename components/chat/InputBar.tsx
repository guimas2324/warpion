"use client";

import { useState } from "react";
import type { ChatAttachment } from "@/types/chat";

export function InputBar({
  onSend,
  disabled,
}: {
  onSend: (value: string, attachments: ChatAttachment[]) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [uploading, setUploading] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed, attachments);
    setValue("");
    setAttachments([]);
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
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950"
          placeholder="Ask WARPION..."
        />
      </div>
      <label className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-zinc-200 px-3 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50">
        📎
        <input type="file" className="hidden" multiple onChange={onFileChange} />
      </label>
      <button
        type="submit"
        disabled={disabled || uploading}
        className="h-11 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {uploading ? "Uploading..." : "Send"}
      </button>
    </form>
  );
}

