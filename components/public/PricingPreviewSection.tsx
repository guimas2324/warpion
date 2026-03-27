"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PUBLIC_PLANS, formatBrl } from "@/lib/plans/catalog";

export function PricingPreviewSection() {
  const [annual, setAnnual] = useState(false);
  const plans = useMemo(() => {
    if (!annual) return PUBLIC_PLANS;
    return PUBLIC_PLANS.map((plan) => ({
      ...plan,
      priceBrlMonthly: plan.priceBrlMonthly === 0 ? 0 : Number((plan.priceBrlMonthly * 0.8).toFixed(2)),
    }));
  }, [annual]);

  return (
    <section id="pricing-preview" className="px-4 py-14 md:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100 md:text-4xl">Planos para cada estágio</h2>
          <button
            onClick={() => setAnnual((v) => !v)}
            className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
          >
            {annual ? "Anual (20% OFF)" : "Mensal"}
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={`rounded-xl border p-4 ${
                plan.id === "pro"
                  ? "scale-[1.02] border-indigo-500 bg-indigo-500/10"
                  : "border-zinc-800 bg-zinc-900/40"
              }`}
            >
              {plan.id === "pro" ? (
                <div className="mb-2 inline-flex rounded-full bg-indigo-500 px-2 py-1 text-[10px] font-semibold text-white">
                  Mais Popular
                </div>
              ) : null}
              <h3 className="text-lg font-semibold text-zinc-100">{plan.displayName}</h3>
              <div className="mt-2 text-sm text-zinc-400">
                {plan.tokensMonthly.toLocaleString("pt-BR")} tokens
              </div>
              <div className="mt-3 text-2xl font-bold text-zinc-100">{formatBrl(plan.priceBrlMonthly)}</div>
              <div className="text-xs text-zinc-500">/mês</div>
              <ul className="mt-4 space-y-1 text-xs text-zinc-300">
                <li>{plan.chat ? "✅" : "❌"} Chat</li>
                <li>{plan.groupWork ? "✅" : "❌"} Group Work</li>
                <li>{plan.hardWork ? "✅" : "❌"} Hard Work</li>
                <li>{plan.automation ? "✅" : "❌"} Automação</li>
              </ul>
              <Link
                href={plan.id === "free" ? "/register" : plan.id === "enterprise" ? "/pricing" : "/register"}
                className="mt-4 block rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-indigo-500"
              >
                {plan.id === "free" ? "Começar" : plan.id === "enterprise" ? "Fale Conosco" : "Assinar"}
              </Link>
            </article>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link href="/pricing" className="text-sm text-indigo-300 underline underline-offset-4">
            Ver comparação completa
          </Link>
        </div>
      </div>
    </section>
  );
}
