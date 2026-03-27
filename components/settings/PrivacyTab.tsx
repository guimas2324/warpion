"use client";

import type { DataRequestItem, ProfileData } from "@/components/settings/types";

type PrivacyTabProps = {
  profile: ProfileData | null;
  requests: DataRequestItem[];
  onRequestAccess: () => void;
  onRequestDelete: () => void;
};

export function PrivacyTab({ profile, requests, onRequestAccess, onRequestDelete }: PrivacyTabProps) {
  const consentVersion =
    typeof profile?.preferences?.consent_version === "string"
      ? String(profile.preferences.consent_version)
      : "v1.0";
  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-zinc-700 bg-zinc-900/40 p-4">
        <div className="text-sm font-semibold text-zinc-100">Consentimento</div>
        <div className="mt-2 text-sm text-zinc-300">
          ✅ Aceito os Termos de Uso e Política de Privacidade
        </div>
        <div className="text-xs text-zinc-500">
          Consentido em:{" "}
          {profile?.consent_at ? `${new Date(profile.consent_at).toLocaleString("pt-BR")} (${consentVersion})` : "n/d"}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-700 bg-zinc-900/40 p-4">
        <div className="text-sm font-semibold text-zinc-100">Seus dados</div>
        <p className="mt-2 text-sm text-zinc-300">
          Armazenamos email, nome, conversas e uso de tokens. Mensagens podem ser processadas por OpenAI, Anthropic,
          Google, DeepSeek e xAI conforme o modelo utilizado.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={onRequestAccess} className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-200 hover:bg-zinc-800">
            Solicitar cópia dos meus dados
          </button>
          <button onClick={onRequestDelete} className="rounded-lg border border-red-500/50 px-3 py-1 text-xs text-red-200 hover:bg-red-500/10">
            Solicitar exclusão de todos os dados
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-700 bg-zinc-900/40 p-4">
        <div className="mb-3 text-sm font-semibold text-zinc-100">Solicitações de dados</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs text-zinc-300">
            <thead>
              <tr className="text-zinc-500">
                <th className="px-2 py-1">Data</th>
                <th className="px-2 py-1">Tipo</th>
                <th className="px-2 py-1">Status</th>
                <th className="px-2 py-1">Resolvido</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((item, index) => (
                <tr key={`${item.type}-${item.created_at}-${index}`} className="border-t border-zinc-800">
                  <td className="px-2 py-2">{new Date(item.created_at).toLocaleString("pt-BR")}</td>
                  <td className="px-2 py-2">{item.type}</td>
                  <td className="px-2 py-2">{item.status}</td>
                  <td className="px-2 py-2">
                    {item.resolved_at ? new Date(item.resolved_at).toLocaleString("pt-BR") : "-"}
                  </td>
                </tr>
              ))}
              {requests.length === 0 ? (
                <tr>
                  <td className="px-2 py-2 text-zinc-500" colSpan={4}>
                    Nenhuma solicitação registrada.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
