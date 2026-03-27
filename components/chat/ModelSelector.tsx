"use client";

import { useChatStore } from "@/stores/chat-store";
import { useModelStore } from "@/stores/model-store";

export function ModelSelector() {
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
    return <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">Auto</span>;
  }

  return (
    <select
      value={modelId ?? ""}
      onChange={(e) => setModelId(e.target.value || undefined)}
      className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <option value="">Select model</option>
      {Object.entries(grouped).map(([provider, items]) => (
        <optgroup key={provider} label={provider}>
          {items.map((m) => (
            <option key={m.id} value={m.id}>
              {m.display_name}
              {m.speed_tier ? ` • ${m.speed_tier}` : ""}
              {m.supports_vision ? " • vision" : ""}
              {m.supports_tools ? " • tools" : ""}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

