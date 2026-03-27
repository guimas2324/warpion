import Link from "next/link";

export function HeroSection({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-16 md:px-6 md:pt-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.2),transparent_50%)]" />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center text-center">
        <h1 className="animate-[fadeIn_0.5s_ease-out] text-5xl font-bold tracking-tight text-zinc-100 md:text-7xl">
          Orquestre múltiplas IAs.
          <span className="block bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
            Resultados extraordinários.
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-zinc-400 md:text-xl">
          O WARPION combina OpenAI, Anthropic, Google, DeepSeek e xAI com um
          Intelligence Engine que otimiza cada interação.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={isLoggedIn ? "/chat" : "/register"}
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500"
          >
            {isLoggedIn ? "Ir para Dashboard" : "Começar Grátis — 50K tokens"}
          </Link>
          <a href="#produto" className="rounded-xl border border-zinc-700 px-5 py-3 text-sm text-zinc-200 hover:bg-zinc-800">
            Ver Demo
          </a>
        </div>
        <div className="mt-10 w-full max-w-3xl rounded-2xl border border-zinc-700 bg-zinc-900/70 p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between text-xs text-zinc-400">
            <span>WARPION Chat Pro</span>
            <span className="rounded-full bg-indigo-500/20 px-2 py-1 text-indigo-200">
              Intelligence Engine • Gemini Flash
            </span>
          </div>
          <div className="space-y-2 text-left text-sm">
            <div className="ml-auto max-w-[75%] rounded-xl bg-zinc-800 px-3 py-2 text-zinc-100">
              Crie um plano de lançamento para SaaS B2B.
            </div>
            <div className="max-w-[82%] rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100">
              Analisando objetivo... roteando para modelo ideal... plano criado com
              milestones semanais, canais e KPIs.
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500">
          {["OpenAI", "Anthropic", "Google", "DeepSeek", "xAI"].map((name) => (
            <span key={name} className="hover:text-zinc-300">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
