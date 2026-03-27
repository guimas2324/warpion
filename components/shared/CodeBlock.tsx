"use client";

import { useState } from "react";

export function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-700 bg-[#1e1e2e]">
      <div className="flex items-center justify-between border-b border-zinc-700 bg-zinc-900/70 px-3 py-2 text-xs text-zinc-300">
        <span className="font-mono uppercase tracking-wide">{language || "code"}</span>
        <button onClick={copy} className="rounded-md border border-zinc-600 px-2 py-0.5 text-[11px] hover:bg-zinc-800">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-6 text-zinc-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

