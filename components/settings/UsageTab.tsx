"use client";

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
import type { UsagePayload } from "@/components/settings/types";

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#22c55e",
  anthropic: "#f59e0b",
  google: "#3b82f6",
  deepseek: "#06b6d4",
  xai: "#ef4444",
};

type UsageTabProps = {
  usage: UsagePayload | null;
  period: "7d" | "30d" | "90d";
  onPeriodChange: (value: "7d" | "30d" | "90d") => void;
  loading: boolean;
};

export function UsageTab({ usage, period, onPeriodChange, loading }: UsageTabProps) {
  const rows = usage?.recent ?? [];
  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-zinc-700 bg-zinc-900/40 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-zinc-100">Uso & Estatísticas</div>
          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value as "7d" | "30d" | "90d")}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200"
          >
            <option value="7d">7d</option>
            <option value="30d">30d</option>
            <option value="90d">90d</option>
          </select>
        </div>
        {loading ? (
          <div className="h-20 animate-pulse rounded-lg bg-zinc-800/70" />
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-zinc-800 p-3 text-xs text-zinc-300">
              <div className="text-zinc-500">Tokens usados</div>
              <div className="text-lg font-semibold text-zinc-100">
                {Number(usage?.summary.total_tokens ?? 0).toLocaleString("pt-BR")}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-800 p-3 text-xs text-zinc-300">
              <div className="text-zinc-500">Mensagens</div>
              <div className="text-lg font-semibold text-zinc-100">
                {Number(usage?.summary.total_messages ?? 0).toLocaleString("pt-BR")}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-800 p-3 text-xs text-zinc-300">
              <div className="text-zinc-500">Modelo mais usado</div>
              <div className="text-lg font-semibold text-zinc-100">{usage?.summary.most_used_model ?? "-"}</div>
            </div>
          </div>
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-700 bg-zinc-900/40 p-4">
          <div className="mb-2 text-sm font-semibold text-zinc-100">Consumo por dia</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(usage?.by_day ?? []).slice().reverse()}>
                <XAxis dataKey="date" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46" }} />
                <Bar dataKey="tokens" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-700 bg-zinc-900/40 p-4">
          <div className="mb-2 text-sm font-semibold text-zinc-100">Distribuição por modelo</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={usage?.by_model ?? []} dataKey="tokens" nameKey="display_name" innerRadius={50} outerRadius={90}>
                  {(usage?.by_model ?? []).map((entry) => (
                    <Cell key={`${entry.provider}-${entry.model}`} fill={PROVIDER_COLORS[entry.provider] ?? "#6366f1"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-zinc-700 bg-zinc-900/40 p-4">
        <div className="mb-3 text-sm font-semibold text-zinc-100">Consumo Detalhado</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs text-zinc-300">
            <thead>
              <tr className="text-zinc-500">
                <th className="px-2 py-1">Data/Hora</th>
                <th className="px-2 py-1">Modelo</th>
                <th className="px-2 py-1">Ferramenta</th>
                <th className="px-2 py-1">In</th>
                <th className="px-2 py-1">Out</th>
                <th className="px-2 py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 20).map((row) => (
                <tr key={row.id} className="border-t border-zinc-800">
                  <td className="px-2 py-2">{new Date(row.created_at).toLocaleString("pt-BR")}</td>
                  <td className="px-2 py-2">{row.model ?? "-"}</td>
                  <td className="px-2 py-2">{row.tool_type ?? "-"}</td>
                  <td className="px-2 py-2">{row.tokens_input.toLocaleString("pt-BR")}</td>
                  <td className="px-2 py-2">{row.tokens_output.toLocaleString("pt-BR")}</td>
                  <td className="px-2 py-2">{(row.tokens_input + row.tokens_output).toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
