"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChatStore } from "@/stores/chat-store";

const NAV = [
  { href: "/chat", label: "Chat Otimizado" },
  { href: "/group-work", label: "Group Work" },
  { href: "/hard-work", label: "Hard Work" },
  { href: "/automation", label: "Automa??o" },
  { href: "/settings", label: "Settings" },
] as const;

type ConversationItem = {
  id: string;
  title: string;
  preview?: string;
  model_used?: string | null;
  provider?: string | null;
  last_message_at?: string;
  updated_at?: string;
  created_at?: string;
};

const PAGE_SIZE = 20;

function shortModelName(modelId?: string | null) {
  if (!modelId) return "auto";
  return modelId
    .replace("claude-", "")
    .replace("gemini-", "")
    .replace("gpt-", "")
    .slice(0, 14);
}

function providerBadge(provider?: string | null) {
  if (!provider) return "AI";
  const normalized = provider.toLowerCase();
  if (normalized.includes("openai")) return "OA";
  if (normalized.includes("anthropic")) return "AN";
  if (normalized.includes("google") || normalized.includes("gemini")) return "GO";
  if (normalized.includes("deepseek")) return "DS";
  if (normalized.includes("xai") || normalized.includes("grok")) return "XA";
  return normalized.slice(0, 2).toUpperCase();
}

function relativeTime(iso?: string) {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  const diff = Date.now() - date.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))}min`;
  if (diff < day) return `${Math.floor(diff / hour)}h`;
  if (diff < day * 2) return "ontem";
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function groupConversations(items: ConversationItem[]) {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);
  const start7Days = new Date(startToday);
  start7Days.setDate(start7Days.getDate() - 7);
  const start30Days = new Date(startToday);
  start30Days.setDate(start30Days.getDate() - 30);

  const bucket: Record<string, ConversationItem[]> = {
    Hoje: [],
    Ontem: [],
    "?ltimos 7 dias": [],
    "?ltimos 30 dias": [],
    "Mais antigos": [],
  };

  for (const conv of items) {
    const when = new Date(conv.updated_at || conv.last_message_at || conv.created_at || 0);
    if (when >= startToday) bucket.Hoje.push(conv);
    else if (when >= startYesterday) bucket.Ontem.push(conv);
    else if (when >= start7Days) bucket["?ltimos 7 dias"].push(conv);
    else if (when >= start30Days) bucket["?ltimos 30 dias"].push(conv);
    else bucket["Mais antigos"].push(conv);
  }

  return bucket;
}

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const conversations = useChatStore((s) => s.conversations) as ConversationItem[];
  const selectedConversationId = useChatStore((s) => s.selectedConversationId);
  const setSelectedConversationId = useChatStore((s) => s.setSelectedConversationId);
  const setConversations = useChatStore((s) => s.setConversations);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setOffset(0);
  }, [debouncedQuery]);

  useEffect(() => {
    async function loadConversations() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: debouncedQuery,
          limit: String(PAGE_SIZE),
          offset: String(offset),
        });
        const res = await fetch(`/api/conversations?${params.toString()}`);
        if (!res.ok) return;
        const json = (await res.json()) as {
          data: ConversationItem[];
          meta?: { has_more?: boolean };
        };
        const incoming = json.data ?? [];
        setConversations(
          offset === 0
            ? incoming
            : [
                ...conversations,
                ...incoming.filter((next) => !conversations.some((prev) => prev.id === next.id)),
              ],
        );
        setHasMore(Boolean(json.meta?.has_more));
      } finally {
        setLoading(false);
      }
    }
    void loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, offset]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const grouped = useMemo(() => groupConversations(conversations), [conversations]);

  async function deleteConversation(id: string) {
    const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    const next = conversations.filter((item) => item.id !== id);
    setConversations(next);
    if (selectedConversationId === id) {
      setSelectedConversationId(undefined);
      window.dispatchEvent(new Event("warpion:new-chat"));
    }
  }

  async function saveConversationTitle(id: string) {
    const title = editingTitle.trim();
    if (!title) {
      setEditingId(null);
      return;
    }
    const res = await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (res.ok) {
      setConversations(
        conversations.map((item) => (item.id === id ? { ...item, title } : item)),
      );
    }
    setEditingId(null);
  }

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
                active ? "bg-indigo-600 text-white" : "text-zinc-300 hover:bg-zinc-900/50",
              ].join(" ")}
            >
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-zinc-700 pt-3">
        <div className="mb-2 flex items-center justify-between px-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Hist?rico</div>
          <button
            onClick={() => {
              setSelectedConversationId(undefined);
              window.dispatchEvent(new Event("warpion:new-chat"));
            }}
            className="rounded-md border border-zinc-700 px-2 py-0.5 text-xs hover:bg-zinc-900/50"
          >
            + Nova conversa
          </button>
        </div>

        <div className="mb-2 px-2">
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar conversas (Ctrl+K)"
            className="h-9 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-xs text-zinc-200 outline-none placeholder:text-zinc-500"
          />
        </div>

        <div className="max-h-[48vh] overflow-y-auto pr-1">
          {loading && offset === 0 ? (
            <div className="space-y-2 px-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="h-12 animate-pulse rounded-lg bg-zinc-800" />
              ))}
            </div>
          ) : null}

          {Object.entries(grouped).map(([label, items]) =>
            items.length ? (
              <div key={label} className="mb-3">
                <div className="px-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</div>
                <div className="mt-1 space-y-1">
                  {items.map((conv) => {
                    const active = selectedConversationId === conv.id;
                    return (
                      <div
                        key={conv.id}
                        className={[
                          "group rounded-lg border border-l-2 px-2 py-1.5",
                          active
                            ? "border-indigo-500 border-l-indigo-500 bg-zinc-800/50"
                            : "border-transparent border-l-transparent hover:bg-zinc-900/50",
                        ].join(" ")}
                      >
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => {
                              setSelectedConversationId(conv.id);
                              setMobileOpen(false);
                            }}
                            className="min-w-0 flex-1 text-left"
                          >
                            {editingId === conv.id ? (
                              <input
                                value={editingTitle}
                                autoFocus
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onBlur={() => saveConversationTitle(conv.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveConversationTitle(conv.id);
                                  if (e.key === "Escape") setEditingId(null);
                                }}
                                className="h-6 w-full rounded border border-zinc-600 bg-zinc-900 px-1 text-xs text-zinc-100"
                              />
                            ) : (
                              <>
                                <div
                                  onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    setEditingId(conv.id);
                                    setEditingTitle(conv.title);
                                  }}
                                  className="truncate text-sm font-medium text-zinc-100"
                                  title={conv.title}
                                >
                                  {conv.title}
                                </div>
                                <div className="truncate text-xs text-zinc-400" title={conv.preview ?? ""}>
                                  {conv.preview || "Sem pr?via"}
                                </div>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => void deleteConversation(conv.id)}
                            className="invisible rounded border border-zinc-700 px-1 py-0.5 text-[10px] text-zinc-400 hover:text-red-300 group-hover:visible"
                            title="Deletar conversa"
                          >
                            ??
                          </button>
                        </div>

                        <div className="mt-1 flex items-center gap-1 text-[10px] text-zinc-500">
                          <span className="rounded-full bg-zinc-900 px-1.5 py-0.5">{providerBadge(conv.provider)}</span>
                          <span className="rounded-full bg-zinc-900 px-1.5 py-0.5">{shortModelName(conv.model_used)}</span>
                          <span className="ml-auto">{relativeTime(conv.last_message_at || conv.updated_at)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null,
          )}

          {hasMore ? (
            <div className="px-2 pb-2">
              <button
                onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
                className="w-full rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-900/50"
                disabled={loading}
              >
                {loading ? "Carregando..." : "Carregar mais"}
              </button>
            </div>
          ) : null}
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
        ?
      </button>

      <aside className="hidden w-[300px] shrink-0 rounded-2xl border border-zinc-700 bg-[var(--card)] p-3 shadow-sm md:block">
        {sidebarContent}
      </aside>

      {mobileOpen ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 z-50 h-full w-[300px] overflow-y-auto border-r border-zinc-700 bg-[var(--card)] p-3 md:hidden">
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
