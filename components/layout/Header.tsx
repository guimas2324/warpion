"use client";

import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useChatStore } from "@/stores/chat-store";

export function Header({ userEmail }: { userEmail: string }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(false);
  const tokensRemaining = useChatStore((s) => s.tokensRemaining);
  const tokensUsedTotal = useChatStore((s) => s.tokensUsedTotal);
  const totalCapacity = Math.max(1, tokensRemaining + tokensUsedTotal);
  const lowThreshold = totalCapacity * 0.1;
  const isLow = tokensRemaining > 0 && tokensRemaining <= lowThreshold;
  const isDepleted = tokensRemaining <= 0;

  async function signOut() {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      window.location.href = "/login";
    } finally {
      setLoading(false);
    }
  }

  return (
    <header className="flex items-center justify-between rounded-2xl border border-zinc-700 bg-[var(--card)] px-4 py-3 shadow-sm">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-zinc-100">Chat Otimizado</div>
        <div className="truncate text-xs text-zinc-500">{userEmail}</div>
      </div>
      <div className="flex items-center gap-2">
        <div className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-200">
          🪙 {tokensRemaining.toLocaleString("pt-BR")} tokens
        </div>
        {isLow ? <div className="rounded-xl border border-red-500/60 bg-red-500/10 px-2 py-1 text-xs text-red-300">Tokens baixos!</div> : null}
        {isDepleted ? <div className="rounded-xl border border-red-500/60 bg-red-500/10 px-2 py-1 text-xs text-red-300">Tokens esgotados</div> : null}
        <button
          disabled={loading}
          onClick={signOut}
          className="h-9 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm font-medium text-zinc-200 hover:bg-zinc-900/50 disabled:opacity-60"
        >
          {loading ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </header>
  );
}

