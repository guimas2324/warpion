export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <div className="grid min-h-dvh lg:grid-cols-2">
        <div className="relative hidden border-r border-zinc-800 lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(99,102,241,0.3),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(168,85,247,0.25),transparent_38%)]" />
          <div className="relative flex w-full flex-col justify-between p-12">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white">
                W
              </span>
              <span className="text-sm font-bold tracking-[0.18em] text-zinc-100">WARPION</span>
            </div>
            <div className="max-w-lg">
              <h2 className="text-5xl font-bold tracking-tight text-zinc-50">
                Orchestrate
                <span className="block bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                  multiple AIs
                </span>
              </h2>
              <p className="mt-4 text-sm leading-7 text-zinc-400">
                Chat, Group Work, Hard Work and Automation in one clean workspace with intelligence layers before every response.
              </p>
              <div className="mt-8 flex flex-wrap gap-2 text-xs text-zinc-500">
                {["OpenAI", "Anthropic", "Google", "DeepSeek", "xAI"].map((item) => (
                  <span key={item} className="rounded-full border border-zinc-800 px-3 py-1">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-xs text-zinc-600">Trusted by teams building with modern AI workflows.</div>
          </div>
        </div>
        <div className="flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-2 lg:hidden">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white">
                W
              </span>
              <span className="text-sm font-bold tracking-wide text-zinc-100">WARPION</span>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

