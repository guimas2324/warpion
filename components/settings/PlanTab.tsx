"use client";

import { useMemo } from "react";
import { PurchaseModal } from "@/components/tokens/PurchaseModal";
import { PUBLIC_PLANS } from "@/lib/plans/catalog";
import type { PlanData, PurchaseItem } from "@/components/settings/types";

type PlanTabProps = {
  plan: PlanData | null;
  purchases: PurchaseItem[];
  purchaseOpen: boolean;
  onOpenPurchase: () => void;
  onClosePurchase: () => void;
  onPurchased: () => void;
};

export function PlanTab(props: PlanTabProps) {
  const { plan, purchases, purchaseOpen, onOpenPurchase, onClosePurchase, onPurchased } = props;

  const monthly = Number(plan?.plan.tokens_monthly ?? 1);
  const remaining = Number(plan?.tokens_remaining ?? 0);
  const used = Math.max(0, monthly - remaining);
  const pct = Math.min(100, Math.round((used / Math.max(1, monthly)) * 100));
  const nextRenewal = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleDateString("pt-BR");
  }, []);

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-zinc-700 bg-zinc-900/40 p-4">
        <div className="text-lg font-semibold text-zinc-100">Plano Atual: {plan?.plan.display_name ?? "-"}</div>
        <div className="mt-3 h-2 rounded-full bg-zinc-800">
          <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 text-sm text-zinc-300">
          {used.toLocaleString("pt-BR")} / {monthly.toLocaleString("pt-BR")} usados
        </div>
        <div className="text-xs text-zinc-500">{remaining.toLocaleString("pt-BR")} tokens restantes • Renova em {nextRenewal}</div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={onOpenPurchase} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500">
            Comprar Tokens Extras
          </button>
          <a href="/pricing" className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800">
            Mudar Plano
          </a>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-700 bg-zinc-900/40 p-4">
        <div className="mb-3 text-sm font-semibold text-zinc-100">Histórico de Compras</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs text-zinc-300">
            <thead>
              <tr className="text-zinc-500">
                <th className="px-2 py-1">Data</th>
                <th className="px-2 py-1">Tokens</th>
                <th className="px-2 py-1">Valor</th>
                <th className="px-2 py-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((item) => (
                <tr key={item.id} className="border-t border-zinc-800">
                  <td className="px-2 py-2">{new Date(item.created_at).toLocaleString("pt-BR")}</td>
                  <td className="px-2 py-2">{Number(item.tokens_amount).toLocaleString("pt-BR")}</td>
                  <td className="px-2 py-2">
                    {(Number(item.price_cents) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </td>
                  <td className="px-2 py-2">{item.status}</td>
                </tr>
              ))}
              {purchases.length === 0 ? (
                <tr>
                  <td className="px-2 py-2 text-zinc-500" colSpan={4}>
                    Nenhuma compra registrada.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-700 bg-zinc-900/40 p-4">
        <div className="mb-2 text-sm font-semibold text-zinc-100">Comparar Planos</div>
        <div className="grid gap-3 md:grid-cols-4">
          {PUBLIC_PLANS.map((item) => (
            <div key={item.id} className="rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-xs text-zinc-300">
              <div className="font-semibold text-zinc-100">{item.displayName}</div>
              <div>{item.tokensMonthly.toLocaleString("pt-BR")} tokens/mês</div>
              <div>{item.chat ? "✅" : "❌"} Chat</div>
              <div>{item.groupWork ? "✅" : "❌"} Group Work</div>
              <div>{item.hardWork ? "✅" : "❌"} Hard Work</div>
            </div>
          ))}
        </div>
      </div>

      <PurchaseModal open={purchaseOpen} onClose={onClosePurchase} onPurchased={onPurchased} />
    </section>
  );
}
