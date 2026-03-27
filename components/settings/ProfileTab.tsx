"use client";

import { useMemo } from "react";
import type { ProfileData } from "@/components/settings/types";

type ProfileTabProps = {
  profile: ProfileData | null;
  draftName: string;
  draftAvatar: string;
  onDraftName: (value: string) => void;
  onDraftAvatar: (value: string) => void;
  onSave: () => void;
  onDeactivate: () => void;
  onRequestDelete: () => void;
};

export function ProfileTab(props: ProfileTabProps) {
  const {
    profile,
    draftName,
    draftAvatar,
    onDraftName,
    onDraftAvatar,
    onSave,
    onDeactivate,
    onRequestDelete,
  } = props;

  const initials = useMemo(() => {
    const source = profile?.full_name?.trim() || profile?.email || "WU";
    const parts = source.split(" ").filter(Boolean);
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
  }, [profile]);

  return (
    <section className="rounded-xl border border-zinc-700 bg-zinc-900/40 p-4">
      <div className="mb-4 flex items-center gap-3">
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt="Avatar" className="h-14 w-14 rounded-full border border-zinc-700 object-cover" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-zinc-700 bg-indigo-500/20 text-sm font-semibold text-indigo-200">
            {initials}
          </div>
        )}
        <div>
          <div className="text-sm font-medium text-zinc-100">{profile?.email ?? "-"}</div>
          <div className="text-xs text-zinc-500">
            Último login:{" "}
            {profile?.last_login_at ? new Date(profile.last_login_at).toLocaleString("pt-BR") : "n/d"}
          </div>
          <div className="text-xs text-zinc-500">Total de logins: {profile?.login_count ?? 0}</div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <div className="mb-1 text-zinc-300">Nome completo</div>
          <input
            value={draftName}
            onChange={(e) => onDraftName(e.target.value)}
            className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100"
          />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-zinc-300">Email</div>
          <input
            value={profile?.email ?? ""}
            readOnly
            className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-500"
          />
        </label>
        <label className="text-sm md:col-span-2">
          <div className="mb-1 text-zinc-300">Avatar URL</div>
          <input
            value={draftAvatar}
            onChange={(e) => onDraftAvatar(e.target.value)}
            className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100"
          />
        </label>
      </div>

      <button
        onClick={onSave}
        className="mt-4 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
      >
        Salvar Alterações
      </button>

      <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4">
        <div className="text-sm font-semibold text-red-200">Zona de perigo</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button onClick={onDeactivate} className="rounded-lg border border-red-500/50 px-3 py-1 text-xs text-red-200 hover:bg-red-500/10">
            Desativar minha conta
          </button>
          <button onClick={onRequestDelete} className="rounded-lg border border-red-500/50 px-3 py-1 text-xs text-red-200 hover:bg-red-500/10">
            Excluir todos os dados
          </button>
        </div>
      </div>
    </section>
  );
}
