const LAYERS = [
  ["1", "Intent Decoder", "Entende sua intenção real e contexto."],
  ["2", "Prompt Architect", "Estrutura prompts com técnicas avançadas."],
  ["3", "Execution", "Seleciona modelo e executa a resposta ideal."],
  ["4", "Quality Gate", "Valida consistência e completude final."],
  ["5", "Adaptive Learning", "Ajusta rotas com histórico e padrões."],
] as const;

export function EngineSection() {
  return (
    <section id="engine" className="px-4 py-14 md:px-6">
      <div className="mx-auto w-full max-w-6xl rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 md:p-8">
        <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-100 md:text-4xl">
          Cada mensagem passa por 5 camadas de otimização
        </h2>
        <div className="mt-8 grid gap-3 md:grid-cols-5">
          {LAYERS.map(([id, name, desc]) => (
            <div key={id} className="rounded-xl border border-zinc-700 bg-zinc-950/60 p-3 text-center">
              <div className="mx-auto mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-bold text-indigo-200">
                {id}
              </div>
              <div className="text-sm font-semibold text-zinc-100">{name}</div>
              <div className="mt-1 text-xs text-zinc-400">{desc}</div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-zinc-400">
          Resultado: respostas mais completas, mais consistentes e com melhor custo-benefício.
        </p>
      </div>
    </section>
  );
}
