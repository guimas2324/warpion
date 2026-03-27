"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ModelSelector } from "@/components/chat/ModelSelector";
import { Menu, Settings, LogOut, User } from "lucide-react";

export function Header({
  userEmail,
  onToggleSidebar,
}: {
  userEmail: string;
  onToggleSidebar: () => void;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function signOut() {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      window.location.href = "/login";
    } finally {
      setLoading(false);
      setMenuOpen(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl">
      <div className="flex h-12 items-center justify-between px-3 md:px-5">
        <button
          type="button"
          aria-label="Alternar menu lateral"
          onClick={onToggleSidebar}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-200"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden text-xs font-semibold tracking-[0.18em] text-zinc-400 md:block">WARPION</div>
          <ModelSelector />
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-300 transition hover:border-zinc-700 hover:text-zinc-100"
            aria-label="Abrir menu do usuário"
          >
            <User className="h-4 w-4" />
          </button>
          {menuOpen ? (
            <div className="absolute right-0 top-10 z-50 w-60 rounded-xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl">
              <div className="mb-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-2 text-xs text-zinc-400">
                <div className="truncate text-zinc-200">{userEmail}</div>
              </div>
              <Link
                href="/settings?tab=profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <button
                disabled={loading}
                onClick={() => void signOut()}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                {loading ? "Signing out..." : "Sign out"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

