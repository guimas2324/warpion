"use client";

import { useEffect, useMemo, useState } from "react";

type ProfileData = {
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  tokens_remaining: number;
  tokens_used_total: number;
};
type PlanData = {
  plan: { display_name: string; tokens_monthly: number; price_cents: number };
  tokens_remaining: number;
  tokens_used_total: number;
};
type ApiKeyRow = { id: string; provider: string; key_hint: string; is_active: boolean };

const PROVIDERS = ["openai", "anthropic", "google", "deepseek", "xai"] as const;

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [usage, setUsage] = useState<Array<{ date: string; tokens: number }>>([]);
  const [draftName, setDraftName] = useState("");
  const [draftAvatar, setDraftAvatar] = useState("");
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  const maxTokens = useMemo(() => Number(plan?.plan.tokens_monthly ?? 1), [plan]);
  const used = useMemo(() => Math.max(0, maxTokens - Number(plan?.tokens_remaining ?? 0)), [maxTokens, plan]);
  const progress = useMemo(() => Math.min(100, Math.round((used / maxTokens) * 100)), [used, maxTokens]);

  async function loadAll() {
    const [profileRes, planRes, keysRes, usageRes] = await Promise.all([
      fetch("/api/settings/profile"),
      fetch("/api/settings/plan"),
      fetch("/api/settings/keys"),
      fetch("/api/settings/usage"),
    ]);

    if (profileRes.ok) {
      const json = (await profileRes.json()) as { data: ProfileData };
      setProfile(json.data);
      setDraftName(json.data.full_name ?? "");
      setDraftAvatar(json.data.avatar_url ?? "");
    }
    if (planRes.ok) {
      const json = (await planRes.json()) as { data: PlanData };
      setPlan(json.data);
    }
    if (keysRes.ok) {
      const json = (await keysRes.json()) as { data: ApiKeyRow[] };
      setKeys(json.data ?? []);
    }
    if (usageRes.ok) {
      const json = (await usageRes.json()) as { data: { daySeries: Array<{ date: string; tokens: number }> } };
      setUsage(json.data?.daySeries ?? []);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  async function saveProfile() {
    const res = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ full_name: draftName, avatar_url: draftAvatar }),
    });
    setMessage(res.ok ? "Perfil salvo." : "Falha ao salvar perfil.");
    await loadAll();
  }

  async function saveKey(provider: string) {
    const key = keyInputs[provider]?.trim();
    if (!key) return;
    const res = await fetch("/api/settings/keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ provider, api_key: key }),
    });
    setMessage(res.ok ? `Key de ${provider} salva.` : `Falha ao salvar key de ${provider}.`);
    setKeyInputs((prev) => ({ ...prev, [provider]: "" }));
    await loadAll();
  }

  async function testKey(provider: string) {
    const key = keyInputs[provider]?.trim();
    if (!key) return;
    const res = await fetch("/api/settings/keys/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ provider, api_key: key }),
    });
    setMessage(res.ok ? `Key de ${provider} parece valida.` : `Key de ${provider} invalida.`);
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <div className="text-lg font-semibold tracking-tight">Settings</div>
        <div className="text-sm text-zinc-500">Perfil, plano, API keys e uso de tokens.</div>
      </div>

      {message ? <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">{message}</div> : null}

      <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-3 text-sm font-semibold">Perfil</div>
        <div className="grid gap-3 md:grid-cols-2">
          <input value={draftName} onChange={(e) => setDraftName(e.target.value)} className="h-10 rounded-xl border border-zinc-200 px-3 text-sm dark:border-zinc-800 dark:bg-black" placeholder="Nome completo" />
          <input value={profile?.email ?? ""} readOnly className="h-10 rounded-xl border border-zinc-200 px-3 text-sm opacity-70 dark:border-zinc-800 dark:bg-black" />
          <input value={draftAvatar} onChange={(e) => setDraftAvatar(e.target.value)} className="h-10 rounded-xl border border-zinc-200 px-3 text-sm dark:border-zinc-800 dark:bg-black md:col-span-2" placeholder="URL do avatar" />
        </div>
        <button onClick={saveProfile} className="mt-3 h-9 rounded-xl bg-zinc-900 px-3 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">Salvar perfil</button>
      </section>

      <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-3 text-sm font-semibold">Plano</div>
        <div className="text-sm">{plan?.plan.display_name ?? "-"}</div>
        <div className="text-xs text-zinc-500">Tokens restantes: {Number(plan?.tokens_remaining ?? 0).toLocaleString()}</div>
        <div className="mt-2 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div className="h-2 rounded-full bg-zinc-900 dark:bg-zinc-100" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-2 text-xs text-zinc-500">{progress}% do plano consumido</div>
        <button className="mt-3 h-9 rounded-xl border border-zinc-200 px-3 text-sm dark:border-zinc-800">Upgrade</button>
      </section>

      <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-3 text-sm font-semibold">API Keys</div>
        <div className="space-y-3">
          {PROVIDERS.map((provider) => {
            const existing = keys.find((k) => k.provider === provider);
            return (
              <div key={provider} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">{provider}</div>
                <div className="mb-2 text-xs text-zinc-500">Atual: {existing?.key_hint ?? "não configurada"}</div>
                <div className="flex gap-2">
                  <input
                    value={keyInputs[provider] ?? ""}
                    onChange={(e) => setKeyInputs((prev) => ({ ...prev, [provider]: e.target.value }))}
                    placeholder="Cole a API key"
                    className="h-10 flex-1 rounded-xl border border-zinc-200 px-3 text-sm dark:border-zinc-800 dark:bg-black"
                  />
                  <button onClick={() => testKey(provider)} className="h-10 rounded-xl border border-zinc-200 px-3 text-sm dark:border-zinc-800">Testar</button>
                  <button onClick={() => saveKey(provider)} className="h-10 rounded-xl bg-zinc-900 px-3 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">Salvar</button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-3 text-sm font-semibold">Uso (30 dias)</div>
        <div className="space-y-1">
          {usage.slice(-10).map((item) => (
            <div key={item.date} className="flex items-center gap-3 text-xs">
              <div className="w-24 text-zinc-500">{item.date}</div>
              <div className="h-2 flex-1 rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div className="h-2 rounded-full bg-zinc-900 dark:bg-zinc-100" style={{ width: `${Math.min(100, Math.round((item.tokens / Math.max(1, ...usage.map((u) => u.tokens))) * 100))}%` }} />
              </div>
              <div className="w-20 text-right">{item.tokens.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

