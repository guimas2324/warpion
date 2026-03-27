"use client";

type PhaseItem = {
  name: string;
  step: number;
  status: "pending" | "running" | "completed" | "error";
  elapsedMs?: number;
  text?: string;
  agent?: string;
};

export function PhaseTimeline({
  phases,
  expanded,
  onToggle,
}: {
  phases: PhaseItem[];
  expanded: Record<string, boolean>;
  onToggle: (phase: string) => void;
}) {
  return (
    <div className="space-y-2">
      {phases.map((phase) => (
        <div key={`${phase.step}-${phase.name}`} className="rounded-lg border border-zinc-800 bg-[#111]">
          <button
            className="flex w-full items-center justify-between px-3 py-2 text-left"
            onClick={() => onToggle(phase.name)}
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-300">
              {phase.step}. {phase.name}
            </span>
            <span className="text-[11px] text-zinc-400">
              {phase.status}
              {phase.elapsedMs ? ` • ${Math.round(phase.elapsedMs / 1000)}s` : ""}
            </span>
          </button>
          {expanded[phase.name] ? (
            <div className="border-t border-zinc-800 px-3 py-2 text-xs text-zinc-300">
              {phase.agent ? <div className="mb-1 text-zinc-500">Agent: {phase.agent}</div> : null}
              <pre className="whitespace-pre-wrap">{phase.text || "-"}</pre>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

