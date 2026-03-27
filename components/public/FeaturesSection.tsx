import { MessageSquare, Users, Zap, Workflow } from "lucide-react";
import { ScrollSection } from "@/components/public/ScrollSection";

const TOOLS = [
  {
    icon: MessageSquare,
    title: "Chat Otimizado",
    description: "Every message passes through the Intelligence Engine before execution for consistent, high-signal outputs.",
    multiplier: "1x",
  },
  {
    icon: Users,
    title: "Group Work",
    description: "3 heterogeneous models debate with diverse reasoning strategies and confidence-weighted synthesis.",
    multiplier: "3x",
  },
  {
    icon: Zap,
    title: "Hard Work",
    description: "1 orchestrator and 5 executors run long tasks with checkpoints, retries and quality validation.",
    multiplier: "6x",
  },
  {
    icon: Workflow,
    title: "Automação",
    description: "Visual drag-and-drop pipelines connect inputs, AI nodes, logic and outputs for repeatable execution.",
    multiplier: "2x",
  },
];

export function FeaturesSection() {
  return (
    <ScrollSection id="produto" className="px-4 py-16 md:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <div className="animate-on-scroll text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100 md:text-5xl">Four tools for every challenge</h2>
          <p className="mt-3 text-zinc-400">From quick prompts to multi-hour execution pipelines.</p>
        </div>
        <div className="stagger-children mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <article
                key={tool.title}
                className="relative rounded-2xl border border-zinc-800/70 bg-zinc-900/50 p-8 transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-700 hover:bg-zinc-900/80"
              >
                <span className="absolute right-4 top-4 rounded-full bg-indigo-500/10 px-3 py-1 text-xs text-indigo-400">
                  {tool.multiplier} tokens
                </span>
                <Icon className="h-10 w-10 text-indigo-400" />
                <h3 className="mt-4 text-xl font-semibold text-zinc-100">{tool.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{tool.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </ScrollSection>
  );
}
