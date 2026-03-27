import Link from "next/link";
import { BrowserMockup } from "@/components/public/BrowserMockup";
import { ScrollSection } from "@/components/public/ScrollSection";

export function HeroSection({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <ScrollSection className="relative overflow-hidden px-4 pb-20 pt-20 md:px-6 md:pt-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.25),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(168,85,247,0.22),transparent_38%)]" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center text-center">
        <div className="animate-on-scroll">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-50 md:text-7xl">
            The AI platform that
            <span className="block bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              thinks before it answers
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-400 md:text-xl">
            5 optimization layers. 16+ models. 5 providers. One intelligent system engineered for Chat, Group Work,
            Hard Work and Automação.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={isLoggedIn ? "/chat" : "/register"}
              className="rounded-full bg-indigo-600 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500"
            >
              {isLoggedIn ? "Ir para Dashboard" : "Start free — 50K tokens"}
            </Link>
            <a
              href="#produto"
              className="rounded-full border border-zinc-700 px-8 py-4 text-sm text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-900"
            >
              Watch demo
            </a>
          </div>
        </div>
        <div className="animate-on-scroll delay-100 mt-12 w-full max-w-4xl">
          <BrowserMockup />
        </div>
        <div className="animate-on-scroll delay-200 mt-8">
          <div className="mb-3 text-xs uppercase tracking-[0.25em] text-zinc-500">Powered by</div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
            {["OpenAI", "Anthropic", "Google", "DeepSeek", "xAI"].map((name) => (
              <span key={name} className="transition hover:text-zinc-300">
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </ScrollSection>
  );
}
