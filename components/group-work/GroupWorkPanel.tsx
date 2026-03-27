"use client";

import { useEffect, useMemo, useState } from "react";
import { InputBar } from "@/components/chat/InputBar";
import { PhaseTimeline } from "@/components/group-work/PhaseTimeline";
import { AgentStreamPanel } from "@/components/group-work/AgentStreamPanel";
import type { ChatAttachment } from "@/types/chat";

type Specialty = {
  specialty: string;
  display_name: string;
  model_1: string;
  model_1_role: string;
  model_2: string;
  model_2_role: string;
  model_3: string;
  model_3_role: string;
};

type PhaseState = {
  name: string;
  step: number;
  status: "pending" | "running" | "completed" | "error";
  elapsedMs?: number;
  text?: string;
  agent?: string;
};

const PHASE_NAMES = [
  "DESFRAGMENTAR",
  "RACIOCINAR_A2",
  "RACIOCINAR_A3",
  "CHECAR_ANEXOS",
  "PLANO_DE_EXECUCAO",
  "EXECUTAR",
  "REVISAO_CRUZADA",
  "SINTESE_FINAL",
];

export function GroupWorkPanel() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [specialty, setSpecialty] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [phases, setPhases] = useState<PhaseState[]>(
    PHASE_NAMES.map((name, idx) => ({ name, step: idx + 1, status: "pending" })),
  );
  const [agentText, setAgentText] = useState<Record<string, string>>({
    "Agente 1": "",
    "Agente 2": "",
    "Agente 3": "",
  });
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [streamError, setStreamError] = useState<string>("");
  const [lastRun, setLastRun] = useState<{ message: string; attachments: ChatAttachment[] } | null>(null);

  useEffect(() => {
    async function loadSpecialties() {
      const res = await fetch("/api/group-work/specialties");
      if (!res.ok) return;
      const json = (await res.json()) as { data: Specialty[] };
      setSpecialties(json.data ?? []);
      if (json.data?.length) setSpecialty(json.data[0].specialty);
    }
    void loadSpecialties();
  }, []);

  const selected = useMemo(
    () => specialties.find((s) => s.specialty === specialty),
    [specialties, specialty],
  );

  function updatePhase(name: string, patch: Partial<PhaseState>) {
    setPhases((prev) => prev.map((p) => (p.name === name ? { ...p, ...patch } : p)));
  }

  async function run(message: string, attachments: ChatAttachment[]) {
    setRunning(true);
    setStreamError("");
    setLastRun({ message, attachments });
    setPhases(PHASE_NAMES.map((name, idx) => ({ name, step: idx + 1, status: "pending" })));
    setAgentText({ "Agente 1": "", "Agente 2": "", "Agente 3": "" });

    const response = await fetch("/api/group-work", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message,
        specialty,
        attachments,
        conversation_id: conversationId,
      }),
    });

    if (!response.body) {
      setStreamError(`Resposta inválida (${response.status})`);
      setRunning(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let sawDone = false;

    const parseEventBlock = (block: string) => {
      const lines = block.split("\n");
      const eventLine = lines.find((l) => l.startsWith("event: "));
      const dataLine = lines.find((l) => l.startsWith("data: "));
      if (!eventLine || !dataLine) return null;
      const event = eventLine.slice(7).trim();
      const dataRaw = dataLine.slice(6);
      try {
        const payload = JSON.parse(dataRaw);
        return { event, payload };
      } catch {
        return { event: "parse_error", payload: { raw: dataRaw } };
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() ?? "";

      for (const chunk of chunks) {
        const parsed = parseEventBlock(chunk);
        if (!parsed) continue;
        const { event, payload } = parsed;
        if (event === "parse_error") {
          setStreamError("Erro ao processar stream (JSON inválido).");
          continue;
        }

        if (event === "meta") {
          if (payload.conversation_id) setConversationId(payload.conversation_id);
        }
        if (event === "phase_start") updatePhase(payload.phase, { status: "running" });
        if (event === "phase_chunk") {
          updatePhase(payload.phase, {
            status: "running",
            text: payload.text,
            agent: payload.agent,
            elapsedMs: payload.elapsed_ms,
          });
          setAgentText((prev) => ({ ...prev, [payload.agent]: payload.text }));
        }
        if (event === "phase_complete") updatePhase(payload.phase, { status: "completed" });
        if (event === "phase_error") updatePhase(payload.phase, { status: "error", text: payload.error });
        if (event === "done") sawDone = true;
      }
    }

    if (!sawDone) {
      setStreamError("Stream interrompido. Você pode tentar reconectar.");
    }
    setRunning(false);
  }

  return (
    <div className="h-full min-h-0 bg-[#0a0a0a] p-4 font-mono text-zinc-100">
      <div className="mb-3 grid gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-[#111] p-3">
          <div className="mb-2 text-xs uppercase tracking-wide text-zinc-500">Especialidade</div>
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="h-10 w-full rounded-lg border border-zinc-700 bg-black px-3 text-sm"
          >
            {specialties.map((s) => (
              <option key={s.specialty} value={s.specialty}>
                {s.display_name}
              </option>
            ))}
          </select>
          {selected ? (
            <div className="mt-3 space-y-1 text-xs text-zinc-300">
              <div>1) {selected.model_1_role}: {selected.model_1}</div>
              <div>2) {selected.model_2_role}: {selected.model_2}</div>
              <div>3) {selected.model_3_role}: {selected.model_3}</div>
            </div>
          ) : null}
        </div>
        <AgentStreamPanel title="Agente 1 (#22c55e)" colorClass="border-green-500/40 bg-green-500/5 text-green-200" text={agentText["Agente 1"]} />
        <AgentStreamPanel title="Agente 2 (#3b82f6)" colorClass="border-blue-500/40 bg-blue-500/5 text-blue-200" text={agentText["Agente 2"]} />
      </div>
      <div className="mb-3">
        <AgentStreamPanel title="Agente 3 (#eab308)" colorClass="border-yellow-500/40 bg-yellow-500/5 text-yellow-200" text={agentText["Agente 3"]} />
      </div>

      <div className="mb-3 max-h-[42vh] overflow-y-auto">
        <PhaseTimeline
          phases={phases}
          expanded={expanded}
          onToggle={(phaseName) => setExpanded((prev) => ({ ...prev, [phaseName]: !prev[phaseName] }))}
        />
      </div>

      <InputBar onSend={run} disabled={running || !specialty} />
      {streamError ? (
        <div className="mt-2 flex items-center justify-between rounded-lg border border-zinc-800 bg-[#111] px-3 py-2 text-xs text-amber-300">
          <span>{streamError}</span>
          <button
            className="rounded-md border border-zinc-700 px-2 py-1 hover:bg-black"
            onClick={() => (lastRun ? run(lastRun.message, lastRun.attachments) : null)}
            disabled={running || !lastRun}
          >
            Reconectar
          </button>
        </div>
      ) : null}
    </div>
  );
}

