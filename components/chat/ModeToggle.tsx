"use client";

import { useChatStore } from "@/stores/chat-store";
import { Sparkles } from "lucide-react";

export function ModeToggle() {
  const mode = useChatStore((s) => s.mode);
  const setMode = useChatStore((s) => s.setMode);

  return (
    <div className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900 p-1">
      <button
        onClick={() => setMode("manual")}
        className={`rounded-full px-3 py-1 text-xs transition ${
          mode === "manual" ? "bg-zinc-200 text-zinc-900" : "text-zinc-400 hover:text-zinc-200"
        }`}
      >
        Manual
      </button>
      <button
        onClick={() => setMode("auto")}
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs transition ${
          mode === "auto" ? "bg-indigo-500 text-white" : "text-zinc-400 hover:text-zinc-200"
        }`}
      >
        <Sparkles className="h-3 w-3" />
        Auto
      </button>
    </div>
  );
}

