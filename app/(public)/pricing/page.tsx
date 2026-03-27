import type { Metadata } from "next";
import Link from "next/link";
import { PUBLIC_PLANS, formatBrl } from "@/lib/plans/catalog";

export const metadata: Metadata = {
  title: "WARPION Pricing — Planos",
  description: "Compare os planos Free, Starter, Pro e Enterprise da WARPION.",
};

const FAQ = [
  ["O que são tokens?", "Tokens representam o volume de processamento consumido em cada interação com IA."],
  ["Posso comprar tokens extras?", "Sim. Tokens avulsos podem ser comprados no painel de settings."],
  ["Qual modelo devo usar?", "No modo auto, o Intelligence Engine escolhe o melhor modelo para sua tarefa."],
  ["Posso cancelar a qualquer momento?", "Sim. Você pode alterar ou cancelar seu plano a qualquer momento."],
  ["Como funciona o Intelligence Engine?", "Ele roteia, reescreve e valida respostas em múltiplas camadas para aumentar qualidade."],
];

export default function PricingPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-100 md:text-5xl">Planos WARPION</h1>
      <p className="mt-3 text-zinc-400">Escolha o plano ideal para seu ritmo de produção com IA.</p>

      <div className="mt-8 overflow-x-auto rounded-xl border border-zinc-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-900 text-zinc-200">
            <tr>
              <th className="px-4 py-3">Plano</th>
              <th className="px-4 py-3">Tokens/mês</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Chat</th>
              <th className="px-4 py-3">Group</th>
              <th className="px-4 py-3">Hard</th>
              <th className="px-4 py-3">Auto</th>
              <th className="px-4 py-3">Agents</th>
              <th className="px-4 py-3">API</th>
              <th className="px-4 py-3">SSO</th>
            </tr>
          </thead>
          <tbody>
            {PUBLIC_PLANS.map((plan) => (
              <tr key={plan.id} className="border-t border-zinc-800 text-zinc-300">
                <td className="px-4 py-3 font-medium text-zinc-100">{plan.displayName}</td>
                <td className="px-4 py-3">{plan.tokensMonthly.toLocaleString("pt-BR")}</td>
                <td className="px-4 py-3">{formatBrl(plan.priceBrlMonthly)}</td>
                <td className="px-4 py-3">{plan.chat ? "✅" : "❌"}</td>
                <td className="px-4 py-3">{plan.groupWork ? "✅" : "❌"}</td>
                <td className="px-4 py-3">{plan.hardWork ? "✅" : "❌"}</td>
                <td className="px-4 py-3">{plan.automation ? "✅" : "❌"}</td>
                <td className="px-4 py-3">{plan.agents ? "✅" : "❌"}</td>
                <td className="px-4 py-3">{plan.apiAccess ? "✅" : "❌"}</td>
                <td className="px-4 py-3">{plan.sso ? "✅" : "❌"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
        <h2 className="text-2xl font-semibold text-zinc-100">FAQ</h2>
        <div className="mt-4 space-y-3">
          {FAQ.map(([q, a]) => (
            <details key={q} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
              <summary className="cursor-pointer font-medium text-zinc-200">{q}</summary>
              <p className="mt-2 text-sm text-zinc-400">{a}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <Link href="/register" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
          Começar Grátis
        </Link>
      </div>
    </div>
  );
}
