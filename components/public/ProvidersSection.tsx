const PROVIDERS = [
  { name: "OpenAI", models: ["GPT-5.2", "GPT-5.4", "o3"] },
  { name: "Anthropic", models: ["Opus 4.6", "Sonnet 4.6", "Haiku 4.5"] },
  { name: "Google", models: ["Gemini 3 Pro", "Gemini 3 Flash", "Imagen"] },
  { name: "DeepSeek", models: ["DeepSeek V3.2"] },
  { name: "xAI", models: ["Grok 4.1"] },
];

export function ProvidersSection() {
  return (
    <section className="px-4 py-14 md:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-100 md:text-4xl">
          16+ modelos dos melhores providers
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-5">
          {PROVIDERS.map((provider) => (
            <div key={provider.name} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="text-sm font-semibold text-zinc-100">{provider.name}</div>
              <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                {provider.models.map((model) => (
                  <li key={model}>{model}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs">
          {["Texto", "Imagem", "Áudio", "Vídeo (em breve)"].map((badge) => (
            <span key={badge} className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-300">
              {badge}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
