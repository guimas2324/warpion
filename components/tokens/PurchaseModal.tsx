"use client";

import { useState } from "react";
import { TOKEN_PACKAGES } from "@/lib/tokens/packages";

type PurchaseModalProps = {
  open: boolean;
  onClose: () => void;
  onPurchased?: () => void;
};

function formatCurrencyBRL(valueCents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valueCents / 100);
}

export function PurchaseModal({ open, onClose, onPurchased }: PurchaseModalProps) {
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  if (!open) return null;

  async function purchase(index: number) {
    setLoadingIndex(index);
    setMessage("");
    try {
      const response = await fetch("/api/tokens/purchase", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ package_index: index }),
      });
      const payload = (await response.json()) as { error?: string; meta?: { message?: string } };
      if (!response.ok) {
        setMessage(payload.error ?? "Falha ao criar compra.");
        return;
      }
      setMessage(payload.meta?.message ?? "Compra criada com sucesso.");
      onPurchased?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao criar compra.");
    } finally {
      setLoadingIndex(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-zinc-700 bg-zinc-950 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-zinc-100">Comprar Tokens Extras</div>
            <div className="text-xs text-zinc-400">Tokens extras nao expiram. Pagamento via Stripe sera integrado na Fase 14.</div>
          </div>
          <button onClick={onClose} className="rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800">
            Fechar
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {TOKEN_PACKAGES.map((item, index) => (
            <div key={item.label} className="rounded-xl border border-zinc-700 bg-zinc-900/50 p-4">
              <div className="text-lg font-semibold text-zinc-100">{item.label}</div>
              <div className="text-xs text-zinc-400">{item.tokens.toLocaleString("pt-BR")} tokens</div>
              <div className="mt-2 text-xs text-zinc-400">~{item.msgs_estimate.toLocaleString("pt-BR")} mensagens</div>
              <div className="mt-4 text-base font-semibold text-zinc-100">{formatCurrencyBRL(item.price_cents)}</div>
              <button
                onClick={() => purchase(index)}
                disabled={loadingIndex !== null}
                className="mt-3 w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
              >
                {loadingIndex === index ? "Processando..." : "Comprar"}
              </button>
            </div>
          ))}
        </div>

        {message ? <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200">{message}</div> : null}
      </div>
    </div>
  );
}
