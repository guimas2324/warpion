"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { PUBLIC_PLANS, formatBrl } from "@/lib/plans/catalog";
import { ScrollSection } from "@/components/public/ScrollSection";

export function PricingSection() {
  const [annual, setAnnual] = useState(false);
  const plans = useMemo(() => {
    if (!annual) return PUBLIC_PLANS;
    return PUBLIC_PLANS.map((plan) => ({
      ...plan,
      priceBrlMonthly: plan.priceBrlMonthly === 0 ? 0 : Number((plan.priceBrlMonthly * 0.8).toFixed(2)),
    }));
  }, [annual]);

  return (
    <ScrollSection id="pricing-preview" className="px-4 py-16 md:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <div className="animate-on-scroll mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100 md:text-5xl">Simple, transparent pricing</h2>
          <button
            onClick={() => setAnnual((v) => !v)}
            className="mt-4 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-700"
          >
            {annual ? "Annual (save 20%)" : "Monthly"}
          </button>
        </div>

        <div className="stagger-children grid gap-4 md:grid-cols-4">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={`rounded-2xl p-6 ${
                plan.id === "pro"
                  ? "scale-[1.02] border-2 border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
                  : "border border-zinc-800 bg-zinc-900/40"
              }`}
            >
              {plan.id === "pro" ? (
                <div className="mb-3 inline-flex rounded-full bg-indigo-500 px-2.5 py-1 text-[10px] font-semibold text-white">
                  Most Popular
                </div>
              ) : null}
              <h3 className="text-lg font-semibold text-zinc-100">{plan.displayName}</h3>
              <div className="mt-1 text-sm text-zinc-400">{plan.tokensMonthly.toLocaleString("pt-BR")} tokens</div>
              <div className="mt-3 text-3xl font-bold text-zinc-100">{formatBrl(plan.priceBrlMonthly)}</div>
              <div className="text-xs text-zinc-500">/mês</div>
              <ul className="mt-5 space-y-2 text-xs text-zinc-300">
                {[
                  ["Chat", plan.chat],
                  ["Group Work", plan.groupWork],
                  ["Hard Work", plan.hardWork],
                  ["Automação", plan.automation],
                ].map(([label, enabled]) => (
                  <li key={String(label)} className="flex items-center gap-2">
                    <Check className={`h-3.5 w-3.5 ${enabled ? "text-emerald-400" : "text-zinc-600"}`} />
                    <span className={enabled ? "text-zinc-300" : "text-zinc-500"}>{label}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.id === "enterprise" ? "/pricing" : "/register"}
                className={`mt-6 block rounded-xl px-3 py-2 text-center text-sm font-medium transition ${
                  plan.id === "pro"
                    ? "bg-indigo-600 text-white hover:bg-indigo-500"
                    : "border border-zinc-700 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800"
                }`}
              >
                {plan.id === "free" ? "Start free" : plan.id === "enterprise" ? "Contact sales" : "Choose plan"}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </ScrollSection>
  );
}
