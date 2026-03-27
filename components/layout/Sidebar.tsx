"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChatStore } from "@/stores/chat-store";
import { MessageSquare, Users, Zap, Workflow, Settings, Plus, Search, Pencil, Trash2, ChevronDown } from "lucide-react";

const NAV = [
  { href: "/chat", label: "Chat Otimizado", icon: MessageSquare },
  { href: "/group-work", label: "Group Work", icon: Users },
  { href: "/hard-work", label: "Hard Work", icon: Zap },
  { href: "/automation", label: "Automacao", icon: Workflow },
  { href: "/settings", label: "Settings", icon: Settings },
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

type ProfileSummaryResponse = {
  data?: {
    tokens_remaining?: number;
    plans?: { display_name?: string; tokens_monthly?: number } | Array<{ display_name?: string; tokens_monthly?: number }>;
  } | null;
};

const PAGE_SIZE = 20;

function shortModelName(modelId?: string | null) {
  if (!modelId) return "auto";
  return modelId.replace("claude-", "").replace("gemini-", "").replace("gpt-", "").slice(0, 14);
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
    "Ultimos 7 dias": [],
    "Ultimos 30 dias": [],
    "Mais antigos": [],
  };

  for (const conv of items) {
    const when = new Date(conv.updated_at || conv.last_message_at || conv.created_at || 0);
    if (when >= startToday) bucket.Hoje.push(conv);
    else if (when >= startYesterday) bucket.Ontem.push(conv);
    else if (when >= start7Days) bucket["Ultimos 7 dias"].push(conv);
    else if (when >= start30Days) bucket["Ultimos 30 dias"].push(conv);
    else bucket["Mais antigos"].push(conv);
  }

  return bucket;
}

export function Sidebar({ userEmail, onCloseMobile }: { userEmail: string; onCloseMobile?: () => void }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [tokensRemaining, setTokensRemaining] = useState(0);
  const [tokensMonthly, setTokensMonthly] = useState(1);
  const [planName, setPlanName] = useState("Free");
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
        const params = new URLSearchParams({ q: debouncedQuery, limit: String(PAGE_SIZE), offset: String(offset) });
        const res = await fetch(`/api/conversations?${params.toString()}`);
        if (!res.ok) return;
        const json = (await res.json()) as { data: ConversationItem[]; meta?: { has_more?: boolean } };
        const incoming = json.data ?? [];
        setConversations(offset === 0 ? incoming : [...conversations, ...incoming.filter((next) => !conversations.some((prev) => prev.id === next.id))]);
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

  useEffect(() => {
    let active = true;
    async function loadProfileSummary() {
      try {
        const response = await fetch("/api/profile/summary", { cache: "no-store" });
        const payload = (await response.json()) as ProfileSummaryResponse;
        if (!active) return;
        const data = payload.data;
        if (!data) return;
        setTokensRemaining(Number(data.tokens_remaining ?? 0));
        const plan = Array.isArray(data.plans) ? data.plans[0] : data.plans;
        setTokensMonthly(Math.max(1, Number(plan?.tokens_monthly ?? 1)));
        setPlanName(String(plan?.display_name ?? "Free"));
      } catch {
        // keep sidebar usable
      }
    }
    void loadProfileSummary();
    return () => {
      active = false;
    };
  }, []);

  const grouped = useMemo(() => groupConversations(conversations), [conversations]);
  const tokensUsed = Math.max(0, tokensMonthly - tokensRemaining);
  const usedPct = Math.max(0, Math.min(100, Math.round((tokensUsed / Math.max(1, tokensMonthly)) * 100)));
  const progressClass = usedPct >= 80 ? "from-red-500 to-rose-500" : usedPct >= 50 ? "from-amber-500 to-orange-500" : "from-indigo-500 to-violet-500";

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
      setConversations(conversations.map((item) => (item.id === id ? { ...item, title } : item)));
    }
    setEditingId(null);
  }

  return (
    <aside className="h-full bg-zinc-950">
      <div className="flex h-full flex-col">
        <div className="px-3 pb-3 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-lg font-semibold tracking-tight text-zinc-100">WARPION</div>
            <button
              type="button"
              onClick={() => {
                setSelectedConversationId(undefined);
                window.dispatchEvent(new Event("warpion:new-chat"));
                onCloseMobile?.();
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-200"
              aria-label="Nova conversa"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <nav className="space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onCloseMobile?.()}
                  className={[
                    "group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all",
                    active ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-2">
                    <Icon className={`h-[18px] w-[18px] ${active ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                    <span>{item.label}</span>
                  </span>
                  {active ? <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" /> : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-zinc-800/70 px-3 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-zinc-600" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar conversas..."
              className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-900/70 pl-9 pr-2 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-zinc-700"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          {loading && offset === 0 ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="h-12 animate-pulse rounded-lg bg-zinc-800" />
              ))}
            </div>
          ) : null}

          {Object.entries(grouped).map(([label, items]) =>
            items.length ? (
              <div key={label} className="mb-3">
                <div className="flex items-center gap-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  <ChevronDown className="h-3 w-3" />
                  {label}
                </div>
                <div className="mt-1 space-y-1">
                  {items.map((conv) => {
                    const active = selectedConversationId === conv.id;
                    return (
                      <div key={conv.id} className={["group rounded-lg px-2 py-1.5 transition-colors", active ? "bg-zinc-800/70" : "hover:bg-zinc-900/70"].join(" ")}>
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => {
                              setSelectedConversationId(conv.id);
                              onCloseMobile?.();
                            }}
                            className="min-w-0 flex-1 text-left"
                          >
                            {editingId === conv.id ? (
                              <input
                                value={editingTitle}
                                autoFocus
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onBlur={() => void saveConversationTitle(conv.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") void saveConversationTitle(conv.id);
                                  if (e.key === "Escape") setEditingId(null);
                                }}
                                className="h-6 w-full rounded border border-zinc-700 bg-zinc-900 px-1 text-xs text-zinc-100"
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
                                  {conv.preview || "Sem previa"}
                                </div>
                              </>
                            )}
                          </button>
                          <div className="invisible flex items-center gap-1 group-hover:visible">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(conv.id);
                                setEditingTitle(conv.title);
                              }}
                              className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                              title="Renomear conversa"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteConversation(conv.id)}
                              className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-red-300"
                              title="Excluir conversa"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
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
            <div className="pb-2">
              <button
                onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
                className="w-full rounded-md border border-zinc-800 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-900/80"
                disabled={loading}
              >
                {loading ? "Carregando..." : "Carregar mais"}
              </button>
            </div>
          ) : null}
        </div>

        <div className="border-t border-zinc-800/70 p-3">
          <Link href="/settings?tab=plan#tokens" className="block">
            <div className="mb-1 flex items-center justify-between text-xs text-zinc-400">
              <span>
                {tokensRemaining.toLocaleString("pt-BR")} / {tokensMonthly.toLocaleString("pt-BR")}
              </span>
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-300">
                {planName}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-900">
              <div className={`h-full bg-gradient-to-r ${progressClass} transition-all duration-500`} style={{ width: `${Math.max(2, usedPct)}%` }} />
            </div>
          </Link>
          <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
            <span className="truncate">{userEmail}</span>
            <Link href="/settings?tab=profile" className="text-zinc-400 transition hover:text-zinc-200">
              Settings
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
