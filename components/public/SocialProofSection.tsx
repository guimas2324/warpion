import { ScrollSection } from "@/components/public/ScrollSection";

const TESTIMONIALS = [
  {
    quote: "O Intelligence Engine transformou minha produtividade no dia a dia.",
    author: "Profissional de TI",
  },
  {
    quote: "Consegui padronizar entregas complexas com melhor custo de tokens.",
    author: "Tech Lead",
  },
  {
    quote: "A combinação de modelos melhorou muito a qualidade das respostas.",
    author: "Product Manager",
  },
];

const METRICS = [
  { value: "40%", label: "melhor resultado" },
  { value: "16+", label: "modelos disponíveis" },
  { value: "5", label: "providers de IA" },
  { value: "99.9%", label: "uptime alvo" },
];

export function SocialProofSection() {
  return (
    <ScrollSection className="px-4 py-14 md:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <h2 className="animate-on-scroll text-center text-3xl font-bold tracking-tight text-zinc-100 md:text-4xl">
          Resultados que convencem
        </h2>
        <div className="stagger-children mt-6 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <blockquote key={item.author} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <p className="text-sm text-zinc-300">“{item.quote}”</p>
              <footer className="mt-3 text-xs text-zinc-500">— {item.author}</footer>
            </blockquote>
          ))}
        </div>
        <div className="stagger-children mt-8 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {METRICS.map((item) => (
            <div key={item.label} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-center">
              <div className="text-2xl font-bold text-zinc-100">{item.value}</div>
              <div className="mt-1 text-xs text-zinc-400">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </ScrollSection>
  );
}
