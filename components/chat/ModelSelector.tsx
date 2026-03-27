"use client";

import { useChatStore } from "@/stores/chat-store";
import { useModelStore } from "@/stores/model-store";

function costBadge(multiplier: number | null | undefined) {
  const value = Number(multiplier ?? 1);
  if (value <= 0.5) return "$";
  if (value <= 1.2) return "$$";
  if (value <= 2.5) return "$$$";
  return "$$$$";
}

export function ModelSelector({
  autoDetails,
}: {
  autoDetails?: { model: string; taskType?: string };
}) {
  const mode = useChatStore((s) => s.mode);
  const modelId = useChatStore((s) => s.modelId);
  const setModelId = useChatStore((s) => s.setModelId);
  const models = useModelStore((s) => s.models);
  const grouped = models.reduce<Record<string, typeof models>>((acc, model) => {
    acc[model.provider] = acc[model.provider] || [];
    acc[model.provider].push(model);
    return acc;
  }, {});

  if (mode === "auto") {
    return (
      <span
        title={
          autoDetails
            ? `Modelo: ${autoDetails.model}${autoDetails.taskType ? ` | tarefa: ${autoDetails.taskType}` : ""}`
            : "O WARPION escolhe automaticamente"
        }
        className="rounded-full border border-indigo-500/40 bg-indigo-500/15 px-3 py-1 text-xs font-medium text-indigo-200"
      >
        Auto - WARPION escolhe
      </span>
    );
  }

  return (
    <select
      value={modelId ?? ""}
      onChange={(e) => setModelId(e.target.value || undefined)}
      className="h-9 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100"
    >
      <option value="">Select model</option>
      {Object.entries(grouped).map(([provider, items]) => (
        <optgroup key={provider} label={provider}>
          {items.map((m) => (
            <option key={m.id} value={m.id}>
              {m.display_name}
              {m.speed_tier ? ` • ${m.speed_tier}` : ""}
              {` • ${costBadge(m.token_multiplier)}`}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

