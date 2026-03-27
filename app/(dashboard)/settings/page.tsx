"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PurchaseModal } from "@/components/tokens/PurchaseModal";

type ProfileData = {
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  tokens_remaining: number;
  tokens_used_total: number;
};
type PlanData = {
  plan: { display_name: string; tokens_monthly: number; price_cents: number; name?: string };
  tokens_remaining: number;
  tokens_used_total: number;
};
type UsagePayload = {
  summary: {
    total_tokens: number;
    total_messages: number;
    avg_tokens_per_message: number;
    most_used_model: string | null;
    most_used_tool: string | null;
  };
  by_model: Array<{ model: string; provider: string; display_name: string; tokens: number; count: number; pct: number }>;
  by_tool: Array<{ tool_type: string; tokens: number; count: number; pct: number }>;
  by_day: Array<{ date: string; tokens: number; count: number }>;
  recent: Array<{
    id: string;
    created_at: string;
    model: string | null;
    provider: string | null;
    tool_type: string | null;
    tokens_input: number;
    tokens_output: number;
    phase: string;
  }>;
};

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#22c55e",
  anthropic: "#f59e0b",
  google: "#3b82f6",
  deepseek: "#06b6d4",
  xai: "#ef4444",
};
const TOOL_COLORS: Record<string, string> = {
  chat: "#6366f1",
  group_work: "#8b5cf6",
  hard_work: "#a855f7",
  automation: "#3b82f6",
};

function formatDate(dateIso: string) {
  const d = new Date(dateIso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows.map((row) => row.map((col) => `"${String(col).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [usage, setUsage] = useState<UsagePayload | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [draftName, setDraftName] = useState("");
  const [draftAvatar, setDraftAvatar] = useState("");
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [toolFilter, setToolFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [message, setMessage] = useState("");

  const maxTokens = useMemo(() => Number(plan?.plan.tokens_monthly ?? 1), [plan]);
  const used = useMemo(() => Math.max(0, maxTokens - Number(plan?.tokens_remaining ?? 0)), [maxTokens, plan]);
  const progress = useMemo(() => Math.min(100, Math.round((used / maxTokens) * 100)), [used, maxTokens]);
  const nextRenewal = useMemo(() => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString("pt-BR");
  }, []);
  const daysToRenewal = useMemo(() => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return Math.max(1, Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }, []);
  const usageRowsFiltered = useMemo(() => {
    const base = usage?.recent ?? [];
    return base.filter((row) => {
      if (modelFilter !== "all" && row.model !== modelFilter) return false;
      if (toolFilter !== "all" && row.tool_type !== toolFilter) return false;
      return true;
    });
  }, [modelFilter, toolFilter, usage]);
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * 20;
    return usageRowsFiltered.slice(start, start + 20);
  }, [page, usageRowsFiltered]);
  const totalPages = Math.max(1, Math.ceil(usageRowsFiltered.length / 20));

  const loadAll = useCallback(async () => {
    setLoadingUsage(true);
    setLoadingPlan(true);
    const [profileRes, planRes, usageRes] = await Promise.all([
      fetch("/api/settings/profile"),
      fetch("/api/settings/plan"),
      fetch(`/api/tokens/usage?period=${period}`),
    ]);

    if (profileRes.ok) {
      const json = (await profileRes.json()) as { data: ProfileData };
      setProfile(json.data);
      setDraftName(json.data.full_name ?? "");
      setDraftAvatar(json.data.avatar_url ?? "");
    }
    if (planRes.ok) {
      const json = (await planRes.json()) as { data: PlanData };
      setPlan(json.data);
      setLoadingPlan(false);
    }
    if (usageRes.ok) {
      const json = (await usageRes.json()) as { data: UsagePayload };
      setUsage(json.data ?? null);
      setLoadingUsage(false);
    }
  }, [period]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function saveProfile() {
    const res = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ full_name: draftName, avatar_url: draftAvatar }),
    });
    setMessage(res.ok ? "Perfil salvo." : "Falha ao salvar perfil.");
    await loadAll();
  }

  return (
    <div id="tokens" className="space-y-6 p-6">
      <div>
        <div className="text-lg font-semibold tracking-tight">Settings</div>
        <div className="text-sm text-zinc-500">Perfil, plano e uso de tokens.</div>
      </div>

      {message ? <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">{message}</div> : null}

      <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-3 text-sm font-semibold">Perfil</div>
        <div className="grid gap-3 md:grid-cols-2">
          <input value={draftName} onChange={(e) => setDraftName(e.target.value)} className="h-10 rounded-xl border border-zinc-200 px-3 text-sm dark:border-zinc-800 dark:bg-black" placeholder="Nome completo" />
          <input value={profile?.email ?? ""} readOnly className="h-10 rounded-xl border border-zinc-200 px-3 text-sm opacity-70 dark:border-zinc-800 dark:bg-black" />
          <input value={draftAvatar} onChange={(e) => setDraftAvatar(e.target.value)} className="h-10 rounded-xl border border-zinc-200 px-3 text-sm dark:border-zinc-800 dark:bg-black md:col-span-2" placeholder="URL do avatar" />
        </div>
        <button onClick={saveProfile} className="mt-3 h-9 rounded-xl bg-zinc-900 px-3 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">Salvar perfil</button>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-zinc-700 bg-zinc-900/40 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold text-zinc-100">Resumo do Plano</div>
            <button className="rounded-lg border border-zinc-600 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800">Upgrade</button>
          </div>
          {loadingPlan ? (
            <div className="h-20 animate-pulse rounded-lg bg-zinc-800/60" />
          ) : (
            <>
              <div className="text-sm text-zinc-200">{plan?.plan.display_name ?? "-"}</div>
              <div className="text-xs text-zinc-500">
                {Number(plan?.tokens_remaining ?? 0).toLocaleString("pt-BR")} / {Number(plan?.plan.tokens_monthly ?? 0).toLocaleString("pt-BR")} tokens
              </div>
              <div className="mt-3 h-2 rounded-full bg-zinc-800">
                <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-2 text-xs text-zinc-400">
                Renova em {daysToRenewal} dias ({nextRenewal})
              </div>
              <button
                onClick={() => setPurchaseOpen(true)}
                className="mt-3 rounded-lg border border-indigo-500/50 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-200 hover:bg-indigo-500/20"
              >
                Comprar Tokens Extras
              </button>
            </>
          )}
        </div>

        <div className="rounded-xl border border-zinc-700 bg-zinc-900/40 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold text-zinc-100">Resumo de Uso</div>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as "7d" | "30d" | "90d")}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200"
            >
              <option value="7d">7 dias</option>
              <option value="30d">30 dias</option>
              <option value="90d">90 dias</option>
            </select>
          </div>
          {loadingUsage ? (
            <div className="h-20 animate-pulse rounded-lg bg-zinc-800/60" />
          ) : (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-zinc-700 p-2">
                <div className="text-zinc-500">Tokens totais</div>
                <div className="text-zinc-100">{Number(usage?.summary.total_tokens ?? 0).toLocaleString("pt-BR")}</div>
              </div>
              <div className="rounded-lg border border-zinc-700 p-2">
                <div className="text-zinc-500">Mensagens</div>
                <div className="text-zinc-100">{Number(usage?.summary.total_messages ?? 0).toLocaleString("pt-BR")}</div>
              </div>
              <div className="rounded-lg border border-zinc-700 p-2">
                <div className="text-zinc-500">Média por msg</div>
                <div className="text-zinc-100">{Number(usage?.summary.avg_tokens_per_message ?? 0).toLocaleString("pt-BR")}</div>
              </div>
              <div className="rounded-lg border border-zinc-700 p-2">
                <div className="text-zinc-500">Modelo mais usado</div>
                <div className="truncate text-zinc-100">{usage?.summary.most_used_model ?? "-"}</div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-zinc-700 bg-zinc-900/40 p-4">
          <div className="mb-2 text-sm font-semibold text-zinc-100">Consumo por Dia</div>
          <div className="h-72">
            {loadingUsage ? (
              <div className="h-full animate-pulse rounded-lg bg-zinc-800/60" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(usage?.by_day ?? []).slice().reverse()}>
                  <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 12 }}
                    labelStyle={{ color: "#e4e4e7" }}
                  />
                  <Bar dataKey="tokens" radius={[6, 6, 0, 0]} fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-700 bg-zinc-900/40 p-4">
          <div className="mb-2 text-sm font-semibold text-zinc-100">Distribuicao por Modelo</div>
          <div className="h-72">
            {loadingUsage ? (
              <div className="h-full animate-pulse rounded-lg bg-zinc-800/60" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={usage?.by_model ?? []} dataKey="tokens" nameKey="display_name" innerRadius={55} outerRadius={95}>
                    {(usage?.by_model ?? []).map((entry) => (
                      <Cell key={`${entry.provider}-${entry.model}`} fill={PROVIDER_COLORS[entry.provider] ?? "#6366f1"} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, item: { payload?: { display_name?: string } }) => [
                      `${Number(value).toLocaleString("pt-BR")} tokens`,
                      item.payload?.display_name ?? "Modelo",
                    ]}
                    contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-2 grid gap-1 text-xs text-zinc-300">
            {(usage?.by_model ?? []).slice(0, 5).map((item) => (
              <div key={item.model} className="flex items-center justify-between">
                <span className="truncate">{item.display_name}</span>
                <span>{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-700 bg-zinc-900/40 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-semibold text-zinc-100">Tabela de Consumo</div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={modelFilter}
              onChange={(e) => {
                setModelFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200"
            >
              <option value="all">Todos os modelos</option>
              {(usage?.by_model ?? []).map((item) => (
                <option key={item.model} value={item.model}>
                  {item.display_name}
                </option>
              ))}
            </select>
            <select
              value={toolFilter}
              onChange={(e) => {
                setToolFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200"
            >
              <option value="all">Todas as ferramentas</option>
              {(usage?.by_tool ?? []).map((item) => (
                <option key={item.tool_type} value={item.tool_type}>
                  {item.tool_type}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                downloadCsv("warpion-token-usage.csv", [
                  ["Data", "Modelo", "Ferramenta", "Input", "Output", "Total"],
                  ...usageRowsFiltered.map((row) => [
                    new Date(row.created_at).toLocaleString("pt-BR"),
                    row.model ?? "-",
                    row.tool_type ?? "-",
                    row.tokens_input,
                    row.tokens_output,
                    row.tokens_input + row.tokens_output,
                  ]),
                ]);
              }}
              className="rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800"
            >
              Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs text-zinc-200">
            <thead className="text-zinc-400">
              <tr>
                <th className="px-2 py-1">Data</th>
                <th className="px-2 py-1">Modelo</th>
                <th className="px-2 py-1">Ferramenta</th>
                <th className="px-2 py-1">Input</th>
                <th className="px-2 py-1">Output</th>
                <th className="px-2 py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.id} className="border-t border-zinc-800">
                  <td className="px-2 py-2">{new Date(row.created_at).toLocaleString("pt-BR")}</td>
                  <td className="px-2 py-2">{row.model ?? "-"}</td>
                  <td className="px-2 py-2">
                    <span
                      className="rounded-full px-2 py-0.5"
                      style={{ backgroundColor: `${TOOL_COLORS[row.tool_type ?? ""] ?? "#3f3f46"}33` }}
                    >
                      {row.tool_type ?? "-"}
                    </span>
                  </td>
                  <td className="px-2 py-2">{row.tokens_input.toLocaleString("pt-BR")}</td>
                  <td className="px-2 py-2">{row.tokens_output.toLocaleString("pt-BR")}</td>
                  <td className="px-2 py-2">{(row.tokens_input + row.tokens_output).toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
          <span>
            Pagina {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border border-zinc-700 px-2 py-1 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded border border-zinc-700 px-2 py-1 disabled:opacity-50"
            >
              Proxima
            </button>
          </div>
        </div>
      </section>

      <PurchaseModal
        open={purchaseOpen}
        onClose={() => setPurchaseOpen(false)}
        onPurchased={() => {
          setMessage("Compra registrada com sucesso.");
          void loadAll();
        }}
      />
    </div>
  );
}

