"use client";

export function AgentStreamPanel({
  title,
  text,
  colorClass,
}: {
  title: string;
  text: string;
  colorClass: string;
}) {
  return (
    <div className={`rounded-xl border p-3 ${colorClass}`}>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide">{title}</div>
      <pre className="whitespace-pre-wrap text-xs leading-5">{text || "Aguardando..."}</pre>
    </div>
  );
}

