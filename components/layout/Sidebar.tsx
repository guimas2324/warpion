"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useChatStore } from "@/stores/chat-store";

const NAV = [
  { href: "/chat", label: "Chat Otimizado" },
  { href: "/group-work", label: "Group Work" },
  { href: "/hard-work", label: "Hard Work" },
  { href: "/automation", label: "Automação" },
  { href: "/settings", label: "Settings" },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const conversations = useChatStore((s) => s.conversations);
  const selectedConversationId = useChatStore((s) => s.selectedConversationId);
  const setSelectedConversationId = useChatStore((s) => s.setSelectedConversationId);

  const grouped = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startYesterday = new Date(startToday);
    startYesterday.setDate(startYesterday.getDate() - 1);
    const startWeek = new Date(startToday);
    startWeek.setDate(startWeek.getDate() - 7);

    const bucket: Record<string, typeof conversations> = {
      Hoje: [],
      Ontem: [],
      "Esta semana": [],
      Anteriores: [],
    };

    for (const conv of conversations) {
      const when = new Date(conv.updated_at || conv.created_at || 0);
      if (when >= startToday) bucket.Hoje.push(conv);
      else if (when >= startYesterday) bucket.Ontem.push(conv);
      else if (when >= startWeek) bucket["Esta semana"].push(conv);
      else bucket.Anteriores.push(conv);
    }
    return bucket;
  }, [conversations]);

  const sidebarContent = (
    <>
      <div className="px-2 py-3">
        <div className="text-xs font-semibold tracking-wide text-zinc-500">PLATFORM</div>
        <div className="text-lg font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">WARPION</span>
        </div>
      </div>

      <nav className="mt-2 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={[
                "flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-300 hover:bg-zinc-900/50",
              ].join(" ")}
            >
              <span className="font-medium">{item.label}</span>
              {item.href === "/chat" ? (
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    active
                      ? "bg-white/15 text-white"
                      : "bg-zinc-900 text-zinc-200",
                  ].join(" ")}
                >
                  Beta
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-zinc-700 pt-3">
        <div className="mb-2 flex items-center justify-between px-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Historico</div>
          <button
            onClick={() => setSelectedConversationId(undefined)}
            className="rounded-md border border-zinc-700 px-2 py-0.5 text-xs hover:bg-zinc-900/50"
          >
            Nova
          </button>
        </div>
        <div className="max-h-[48vh] overflow-y-auto pr-1">
          {Object.entries(grouped).map(([label, items]) =>
            items.length ? (
              <div key={label} className="mb-3">
                <div className="px-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</div>
                <div className="mt-1 space-y-1">
                  {items.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setSelectedConversationId(conv.id);
                        setMobileOpen(false);
                      }}
                      className={[
                        "w-full truncate rounded-lg px-2 py-1.5 text-left text-sm",
                        selectedConversationId === conv.id
                          ? "bg-indigo-600 text-white"
                          : "text-zinc-300 hover:bg-zinc-900/50",
                      ].join(" ")}
                    >
                      {conv.title}
                    </button>
                  ))}
                </div>
              </div>
            ) : null,
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-40 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 md:hidden"
      >
        ☰
      </button>

      <aside className="hidden w-[280px] shrink-0 rounded-2xl border border-zinc-700 bg-[var(--card)] p-3 shadow-sm md:block">
        {sidebarContent}
      </aside>

      {mobileOpen ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 z-50 h-full w-[280px] overflow-y-auto border-r border-zinc-700 bg-[var(--card)] p-3 md:hidden">
            <div className="mb-2 flex justify-end">
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-200"
              >
                Fechar
              </button>
            </div>
            {sidebarContent}
          </aside>
        </>
      ) : null}
    </>
  );
}

