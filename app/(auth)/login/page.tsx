"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      router.replace("/chat");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sign in";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function onResetPassword() {
    if (!email) {
      setError("Informe seu email para recuperar a senha.");
      return;
    }
    setError(null);
    setInfo(null);
    setResetLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (resetError) throw resetError;
      setInfo("Enviamos um link de recuperação para seu email.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao enviar recuperação";
      setError(message);
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-sm">
      <div className="mb-4">
        <div className="text-2xl font-semibold tracking-tight text-zinc-100">Entrar</div>
        <div className="mt-1 text-sm text-zinc-400">Acesse sua conta para abrir o workspace.</div>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-100">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
            className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none ring-0 placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            placeholder="you@company.com"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-100">Senha</label>
            <button
              type="button"
              onClick={onResetPassword}
              disabled={resetLoading}
              className="text-xs text-indigo-300 hover:text-indigo-200 disabled:opacity-50"
            >
              {resetLoading ? "Enviando..." : "Esqueceu a senha?"}
            </button>
          </div>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            required
            className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none ring-0 placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            placeholder="••••••••"
          />
        </div>

        {error ? (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        ) : null}
        {info ? <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{info}</div> : null}

        <button
          disabled={loading}
          className="h-11 w-full rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <div className="text-sm text-zinc-400">
          Não tem conta?{" "}
          <a className="font-medium text-zinc-100 underline-offset-4 hover:underline" href="/register">
            Criar conta grátis
          </a>
        </div>
      </form>
    </div>
  );
}

