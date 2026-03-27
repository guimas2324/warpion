import { Brain, Wrench, Cpu, ShieldCheck, TrendingUp } from "lucide-react";
import { ScrollSection } from "@/components/public/ScrollSection";

const LAYERS = [
  { id: "1", name: "Intent Decoder", desc: "~50 tokens", icon: Brain },
  { id: "2", name: "Prompt Architect", desc: "~100 tokens", icon: Wrench },
  { id: "3", name: "Execution", desc: "Variable", icon: Cpu },
  { id: "4", name: "Quality Gate", desc: "~100 tokens", icon: ShieldCheck },
  { id: "5", name: "Adaptive Learning", desc: "Zero cost", icon: TrendingUp },
] as const;

export function EngineSection() {
  return (
    <ScrollSection id="engine" className="px-4 py-16 md:px-6">
      <div className="mx-auto w-full max-w-6xl rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 md:p-8">
        <div className="animate-on-scroll text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100 md:text-5xl">Every message passes through</h2>
          <p className="mt-3 text-zinc-400">5 layers of optimization before final delivery.</p>
        </div>

        <div className="stagger-children mt-10 grid gap-4 md:grid-cols-5">
          {LAYERS.map((layer, idx) => {
            const Icon = layer.icon;
            return (
              <div key={layer.id} className="relative rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-center">
                {idx < LAYERS.length - 1 ? (
                  <div className="pointer-events-none absolute -right-2 top-1/2 hidden h-[2px] w-4 -translate-y-1/2 bg-gradient-to-r from-indigo-400 to-violet-400 md:block" />
                ) : null}
                <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold text-zinc-100">{layer.name}</div>
                <div className="mt-1 text-xs text-zinc-500">{layer.desc}</div>
              </div>
            );
          })}
        </div>

        <div className="animate-on-scroll delay-200 mt-8 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-300">
          Before: direct prompt to a single model.
          <br />
          After: routed reasoning, optimized prompting and quality checks before the answer reaches the user.
        </div>
      </div>
    </ScrollSection>
  );
}
