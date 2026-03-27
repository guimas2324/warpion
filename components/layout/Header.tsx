"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useChatStore } from "@/stores/chat-store";

type PlanSummary = {
  name: string;
  display_name: string;
  tokens_monthly: number;
  price_cents: number;
};

type ProfileSummaryResponse = {
  data?: {
    tokens_remaining?: number;
    tokens_used_total?: number;
    plans?: PlanSummary | PlanSummary[];
  } | null;
};

const PLAN_BADGE_MAP: Record<string, string> = {
  free: "border-zinc-600/80 bg-zinc-800/70 text-zinc-300",
  starter: "border-indigo-500/50 bg-indigo-500/10 text-indigo-300",
  pro: "border-violet-500/50 bg-violet-500/10 text-violet-300",
  enterprise: "border-amber-500/50 bg-amber-500/10 text-amber-300",
};

export function Header({ userEmail }: { userEmail: string }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<PlanSummary | null>(null);
  const tokensRemaining = useChatStore((s) => s.tokensRemaining);
  const tokensUsedTotal = useChatStore((s) => s.tokensUsedTotal);
  const setTokensRemaining = useChatStore((s) => s.setTokensRemaining);
  const setTokensUsedTotal = useChatStore((s) => s.setTokensUsedTotal);

  const fallbackMonthly = tokensRemaining + tokensUsedTotal;
  const tokensMonthly = Math.max(1, (plan?.tokens_monthly ?? fallbackMonthly) || 1);
  const usedPct = Math.max(0, Math.min(100, Math.round((tokensUsedTotal / tokensMonthly) * 100)));
  const lowThreshold = tokensMonthly * 0.1;
  const isLow = tokensRemaining > 0 && tokensRemaining <= lowThreshold;
  const isDepleted = tokensRemaining <= 0;
  const remainingDays = useMemo(() => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const diffMs = nextMonth.getTime() - now.getTime();
    return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, []);

  const progressClass =
    usedPct < 50
      ? "from-indigo-500 to-violet-500"
      : usedPct < 80
        ? "from-amber-500 to-orange-500"
        : "from-red-500 to-rose-500 animate-pulse";
  const planBadgeClass = PLAN_BADGE_MAP[plan?.name ?? ""] ?? PLAN_BADGE_MAP.free;

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      try {
        const response = await fetch("/api/profile/summary", { cache: "no-store" });
        const payload = (await response.json()) as ProfileSummaryResponse;
        if (!active) return;
        const data = payload.data;
        if (!data) return;
        setTokensRemaining(Number(data.tokens_remaining ?? 0));
        setTokensUsedTotal(Number(data.tokens_used_total ?? 0));
        const rawPlan = data.plans;
        const resolvedPlan = Array.isArray(rawPlan) ? rawPlan[0] : rawPlan;
        setPlan(resolvedPlan ?? null);
      } catch {
        // Header remains functional with store fallback values.
      }
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, [setTokensRemaining, setTokensUsedTotal]);

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
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/settings#tokens")}
          className="group relative hidden min-w-[360px] rounded-xl border border-zinc-700 bg-zinc-900/70 px-3 py-2 text-left md:block"
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="truncate text-xs font-medium text-zinc-200">
              {tokensRemaining.toLocaleString("pt-BR")} / {tokensMonthly.toLocaleString("pt-BR")}
            </div>
            <div className={`rounded-lg border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${planBadgeClass}`}>
              {plan?.display_name ?? "Free"}
            </div>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className={`h-full bg-gradient-to-r ${progressClass} transition-all duration-700 ease-out`}
              style={{ width: `${Math.max(2, usedPct)}%` }}
            />
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">{usedPct}% usado</div>
          <div className="pointer-events-none absolute -bottom-24 left-0 z-20 hidden w-[320px] rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-xs text-zinc-200 shadow-xl group-hover:block">
            <div>Plano {plan?.display_name ?? "Free"} • {tokensRemaining.toLocaleString("pt-BR")} tokens restantes</div>
            <div className="mt-1 text-zinc-400">Consumiu {tokensUsedTotal.toLocaleString("pt-BR")} este mês</div>
            <div className="mt-1 text-zinc-400">Renova em {remainingDays} dias</div>
          </div>
        </button>
        <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-200 md:hidden">
          <span className={usedPct >= 80 ? "text-red-400" : usedPct >= 50 ? "text-amber-400" : "text-indigo-400"}>●</span>
          <span>{tokensRemaining.toLocaleString("pt-BR")}</span>
        </div>
        {isLow ? <div className="hidden rounded-xl border border-amber-500/60 bg-amber-500/10 px-2 py-1 text-xs text-amber-300 lg:block">Tokens baixos!</div> : null}
        {isDepleted ? <div className="hidden rounded-xl border border-red-500/60 bg-red-500/10 px-2 py-1 text-xs text-red-300 lg:block">Tokens esgotados</div> : null}
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

