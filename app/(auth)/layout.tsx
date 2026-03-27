export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-zinc-950">
      <div className="grid min-h-dvh lg:grid-cols-2">
        <div className="flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white">
                W
              </span>
              <span className="text-sm font-bold tracking-wide text-zinc-100">WARPION</span>
            </div>
            {children}
          </div>
        </div>
        <div className="relative hidden border-l border-zinc-800 lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.35),transparent_50%)]" />
          <div className="relative flex w-full flex-col justify-center p-10">
            <div className="max-w-lg">
              <h2 className="text-4xl font-bold tracking-tight text-zinc-100">
                Multi-IA com
                <span className="block bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                  Intelligence Engine
                </span>
              </h2>
              <p className="mt-3 text-sm text-zinc-400">
                Chat, Group Work, Hard Work e Automação em um único workspace.
              </p>
              <div className="mt-6 rounded-xl border border-zinc-700 bg-zinc-900/60 p-4 text-sm text-zinc-300">
                “O WARPION me deu respostas mais consistentes em menos tempo.”
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

