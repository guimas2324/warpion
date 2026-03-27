"use client";

import { useChatStore } from "@/stores/chat-store";

export function ModeToggle() {
  const mode = useChatStore((s) => s.mode);
  const setMode = useChatStore((s) => s.setMode);

  return (
    <div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950">
      <button
        onClick={() => setMode("manual")}
        className={`rounded-lg px-3 py-1.5 text-sm ${mode === "manual" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-600 dark:text-zinc-300"}`}
      >
        Manual
      </button>
      <button
        onClick={() => setMode("auto")}
        className={`rounded-lg px-3 py-1.5 text-sm ${mode === "auto" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-600 dark:text-zinc-300"}`}
      >
        Auto
      </button>
    </div>
  );
}

