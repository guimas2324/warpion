import { Sparkles } from "lucide-react";

export function BrowserMockup() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-[0_40px_80px_rgba(0,0,0,0.45)] animate-[fadeInUp_0.8s_ease-out]">
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        <div className="ml-3 rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-[10px] text-zinc-500">
          app.warpionai.com/chat
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="ml-auto max-w-[75%] rounded-xl bg-zinc-900 px-4 py-3 text-sm text-zinc-200">
          Estruture um plano de go-to-market para SaaS B2B com foco em CAC payback.
        </div>
        <div className="max-w-[85%] space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>WARPION · Claude Sonnet 4.6</span>
          </div>
          <div className="text-sm leading-6 text-zinc-200">
            Estruturei em 3 fases com metas semanais, canais de aquisição e checkpoints de qualidade para reduzir
            risco de burn no início da operação.
          </div>
          <div className="text-xs text-zinc-500">Intent Decoder · Prompt Architect · Quality Gate</div>
        </div>
      </div>
    </div>
  );
}
