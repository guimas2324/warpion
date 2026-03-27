import { ImageIcon, Volume2, Mic, Sparkles, Star } from "lucide-react";
import { ScrollSection } from "@/components/public/ScrollSection";

const PROVIDERS = [
  { name: "OpenAI", models: ["GPT-5.4", "GPT-5.2", "o3"] },
  { name: "Anthropic", models: ["Opus 4.6", "Sonnet 4.6", "Haiku 4.5"] },
  { name: "Google", models: ["Gemini 3.1 Pro", "Gemini Flash", "Imagen 4"] },
  { name: "DeepSeek", models: ["V3.2", "V4"] },
  { name: "xAI", models: ["Grok 4.1 (2M ctx)"] },
];

export function ModelsSection() {
  return (
    <ScrollSection className="px-4 py-16 md:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <div className="animate-on-scroll text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100 md:text-5xl">
            Access the world&apos;s best AI models
          </h2>
        </div>

        <div className="stagger-children mt-10 grid gap-4 md:grid-cols-5">
          {PROVIDERS.map((provider) => (
            <article key={provider.name} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="mb-2 text-sm font-semibold text-zinc-100">{provider.name}</div>
              <ul className="space-y-1 text-xs text-zinc-400">
                {provider.models.map((model) => (
                  <li key={model}>{model}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="animate-on-scroll delay-200 mt-6 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-300">
            <ImageIcon className="mb-2 h-4 w-4 text-indigo-400" />
            Image generation: GPT Image, Gemini Imagen
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-300">
            <Volume2 className="mb-2 h-4 w-4 text-indigo-400" />
            TTS: OpenAI TTS, ElevenLabs
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-300">
            <Mic className="mb-2 h-4 w-4 text-indigo-400" />
            STT: Whisper and voice workflows
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-300">
            <Sparkles className="mb-2 h-4 w-4 text-indigo-400" />
            Auto mode routes the best model per task
          </div>
        </div>

        <div className="animate-on-scroll delay-300 mt-6 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-400">
          <Star className="h-3.5 w-3.5 text-indigo-400" />
          16+ models available across text, image and audio
        </div>
      </div>
    </ScrollSection>
  );
}
