"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!fullName.trim()) throw new Error("Nome completo é obrigatório.");
      if (password.length < 8) throw new Error("A senha deve ter no mínimo 8 caracteres.");
      if (password !== confirmPassword) throw new Error("As senhas não coincidem.");
      if (!consent) throw new Error("Você precisa aceitar os termos e a política de privacidade.");

      const consentAt = new Date().toISOString();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            consent_at: consentAt,
            consent_version: "v1.0",
          },
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
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-7 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
      <div className="mb-4">
        <div className="text-2xl font-semibold tracking-tight text-zinc-100">
          Create account
        </div>
        <div className="mt-1 text-sm text-zinc-400">
          Start with 50,000 free tokens.
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="register-full-name" className="text-sm font-medium text-zinc-200">Full name</label>
          <input
            id="register-full-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            type="text"
            autoComplete="name"
            className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none ring-0 placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Your name"
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="register-email" className="text-sm font-medium text-zinc-200">Email</label>
          <input
            id="register-email"
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
          <label htmlFor="register-password" className="text-sm font-medium text-zinc-200">Password</label>
          <input
            id="register-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            required
            className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none ring-0 placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            placeholder="At least 8 characters"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="register-confirm-password" className="text-sm font-medium text-zinc-200">Confirm password</label>
          <input
            id="register-confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            required
            className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none ring-0 placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Repeat password"
          />
        </div>
        <label className="flex items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-300">
          <input
            id="register-consent"
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-indigo-500"
          />
          <span>
            I agree to the{" "}
            <a href="/terms" target="_blank" rel="noreferrer" className="text-indigo-300 underline underline-offset-4">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" target="_blank" rel="noreferrer" className="text-indigo-300 underline underline-offset-4">
              Privacy Policy
            </a>
            .
          </span>
        </label>

        {error ? (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <button
          disabled={loading || !consent}
          className="h-11 w-full rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
        >
          {loading ? "Creating..." : "Create free account"}
        </button>

        <div className="text-sm text-zinc-400">
          Already have an account?{" "}
          <a className="font-medium text-zinc-100 underline-offset-4 hover:underline" href="/login">
            Sign in
          </a>
        </div>
      </form>
    </div>
  );
}

