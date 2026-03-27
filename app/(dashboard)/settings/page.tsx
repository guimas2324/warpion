"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProfileTab } from "@/components/settings/ProfileTab";
import { PlanTab } from "@/components/settings/PlanTab";
import { UsageTab } from "@/components/settings/UsageTab";
import { PrivacyTab } from "@/components/settings/PrivacyTab";
import type {
  DataRequestItem,
  PlanData,
  ProfileData,
  PurchaseItem,
  SettingsTab,
  UsagePayload,
} from "@/components/settings/types";
import { PurchaseModal } from "@/components/tokens/PurchaseModal";

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [usage, setUsage] = useState<UsagePayload | null>(null);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [dataRequests, setDataRequests] = useState<DataRequestItem[]>([]);
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [draftName, setDraftName] = useState("");
  const [draftAvatar, setDraftAvatar] = useState("");
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const hash = searchParams.get("tab") as SettingsTab | null;
    if (hash && ["profile", "plan", "usage", "privacy"].includes(hash)) {
      setActiveTab(hash);
    }
  }, [searchParams]);

  const loadAll = useCallback(async () => {
    setLoadingUsage(true);
    const [profileRes, planRes, usageRes] = await Promise.all([
      fetch("/api/settings/profile"),
      fetch("/api/settings/plan"),
      fetch(`/api/tokens/usage?period=${period}`),
    ]);
    const [purchasesRes, requestsRes] = await Promise.all([
      fetch("/api/settings/purchases"),
      fetch("/api/settings/data-requests"),
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
    if (usageRes.ok) {
      const json = (await usageRes.json()) as { data: UsagePayload };
      setUsage(json.data ?? null);
      setLoadingUsage(false);
    }
    if (purchasesRes.ok) {
      const json = (await purchasesRes.json()) as { data: PurchaseItem[] };
      setPurchases(json.data ?? []);
    }
    if (requestsRes.ok) {
      const json = (await requestsRes.json()) as { data: DataRequestItem[] };
      setDataRequests(json.data ?? []);
    }
  }, [period]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function saveProfile() {
    const res = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ full_name: draftName, avatar_url: draftAvatar }),
    });
    setMessage(res.ok ? "Perfil salvo." : "Falha ao salvar perfil.");
    await loadAll();
  }

  async function createDataRequest(type: "access" | "delete") {
    const confirmed =
      type === "delete"
        ? window.prompt("Digite DELETE para confirmar a solicitação de exclusão.") === "DELETE"
        : true;
    if (!confirmed) return;
    const response = await fetch("/api/settings/data-request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(payload.error ?? "Falha ao registrar solicitação.");
      return;
    }
    setMessage(type === "delete" ? "Solicitação de exclusão registrada." : "Solicitação de acesso registrada.");
    await loadAll();
  }

  async function deactivateAccount() {
    if (!window.confirm("Deseja desativar sua conta?")) return;
    const response = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deactivate: true }),
    });
    if (response.ok) {
      window.location.href = "/login";
    } else {
      setMessage("Falha ao desativar conta.");
    }
  }

  return (
    <div id="tokens" className="space-y-6 p-6">
      <div>
        <div className="text-lg font-semibold tracking-tight">Settings</div>
        <div className="text-sm text-zinc-500">Perfil, plano e uso de tokens.</div>
      </div>
      <div className="flex flex-wrap gap-2">
        {([
          ["profile", "Perfil"],
          ["plan", "Plano & Tokens"],
          ["usage", "Uso & Estatísticas"],
          ["privacy", "Privacidade"],
        ] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              router.replace(`/settings?tab=${tab}`);
            }}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              activeTab === tab
                ? "border-indigo-500 bg-indigo-500/10 text-indigo-200"
                : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {message ? <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">{message}</div> : null}

      {activeTab === "profile" ? (
        <ProfileTab
          profile={profile}
          draftName={draftName}
          draftAvatar={draftAvatar}
          onDraftName={setDraftName}
          onDraftAvatar={setDraftAvatar}
          onSave={() => void saveProfile()}
          onDeactivate={() => void deactivateAccount()}
          onRequestDelete={() => void createDataRequest("delete")}
        />
      ) : null}
      {activeTab === "plan" ? (
        <PlanTab
          plan={plan}
          purchases={purchases}
          purchaseOpen={purchaseOpen}
          onOpenPurchase={() => setPurchaseOpen(true)}
          onClosePurchase={() => setPurchaseOpen(false)}
          onPurchased={() => {
            setMessage("Compra registrada com sucesso.");
            void loadAll();
          }}
        />
      ) : null}
      {activeTab === "usage" ? (
        <UsageTab
          usage={usage}
          period={period}
          onPeriodChange={setPeriod}
          loading={loadingUsage}
        />
      ) : null}
      {activeTab === "privacy" ? (
        <PrivacyTab
          profile={profile}
          requests={dataRequests}
          onRequestAccess={() => void createDataRequest("access")}
          onRequestDelete={() => void createDataRequest("delete")}
        />
      ) : null}
      <PurchaseModal
        open={purchaseOpen}
        onClose={() => setPurchaseOpen(false)}
        onPurchased={() => {
          setMessage("Compra registrada com sucesso.");
          void loadAll();
        }}
      />
    </div>
  );
}

