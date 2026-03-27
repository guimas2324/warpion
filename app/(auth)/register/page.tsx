"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (signUpError) throw signUpError;

      router.replace("/chat");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to register";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-4">
        <div className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Create your account
        </div>
        <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Start with the optimized chat in seconds.
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Full name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            type="text"
            autoComplete="name"
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:bg-black dark:text-zinc-100"
            placeholder="Your name"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:bg-black dark:text-zinc-100"
            placeholder="you@company.com"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            required
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:bg-black dark:text-zinc-100"
            placeholder="At least 8 characters"
          />
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        ) : null}

        <button
          disabled={loading}
          className="h-11 w-full rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          type="submit"
        >
          {loading ? "Creating..." : "Create account"}
        </button>

        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          Already have an account?{" "}
          <a className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100" href="/login">
            Sign in
          </a>
        </div>
      </form>
    </div>
  );
}

