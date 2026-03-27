const TOOLS = [
  {
    icon: "💬",
    title: "Chat Otimizado",
    description: "1 IA com Intelligence Engine para respostas melhores e mais rápidas.",
    multiplier: "1x",
  },
  {
    icon: "👥",
    title: "Group Work",
    description: "3 IAs em debate heterogêneo para explorar perspectivas diferentes.",
    multiplier: "3x",
  },
  {
    icon: "⚡",
    title: "Hard Work",
    description: "1 orquestradora + 5 executoras para tarefas complexas de alto impacto.",
    multiplier: "6x",
  },
  {
    icon: "🔄",
    title: "Automação",
    description: "Workflows visuais com nodes IA para escalar processos recorrentes.",
    multiplier: "2x",
  },
];

export function FeaturesSection() {
  return (
    <section id="produto" className="px-4 py-14 md:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-100 md:text-4xl">
          4 ferramentas. Poder ilimitado.
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {TOOLS.map((tool, index) => (
            <article
              key={tool.title}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/10"
              style={{ animation: `fadeIn 0.45s ease-out ${index * 90}ms both` }}
            >
              <div className="text-2xl">{tool.icon}</div>
              <h3 className="mt-2 text-base font-semibold text-zinc-100">{tool.title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{tool.description}</p>
              <div className="mt-4 inline-flex rounded-full bg-indigo-500/15 px-2 py-1 text-xs font-medium text-indigo-200">
                {tool.multiplier} tokens
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
