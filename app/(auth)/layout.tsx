export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-zinc-50 dark:bg-black">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-10">
        <div className="mb-8">
          <div className="text-sm font-semibold tracking-wide text-zinc-500">WARPION</div>
          <div className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Welcome back
          </div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Sign in to access your workspace.
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

