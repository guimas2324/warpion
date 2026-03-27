"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatAttachment } from "@/types/chat";
import { useChatStore } from "@/stores/chat-store";
import { useModelStore } from "@/stores/model-store";
import { VoiceRecorder } from "@/components/chat/VoiceRecorder";
import { Paperclip, Image as ImageIcon, ArrowUp, Square } from "lucide-react";

const MAX_ATTACHMENT_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_ATTACHMENTS_PER_MESSAGE = 5;
const ACCEPTED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const ACCEPTED_EXTENSIONS = [".py", ".js", ".ts", ".md", ".csv", ".json", ".txt", ".xlsx", ".docx"];

type UploadStatus = {
  name: string;
  status: "uploading" | "error";
  error?: string;
};

export function InputBar({
  onSend,
  onStop,
  disabled,
  isStreaming,
  mode,
  tokensDepleted,
}: {
  onSend: (value: string, attachments: ChatAttachment[]) => void;
  onStop?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
  mode?: "manual" | "auto";
  tokensDepleted?: boolean;
}) {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus[]>([]);
  const modelId = useChatStore((s) => s.modelId);
  const tokensRemaining = useChatStore((s) => s.tokensRemaining);
  const models = useModelStore((s) => s.models);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const charCount = value.length;
  const selectedModel = models.find((item) => item.id === modelId);
  const modelMultiplier = Number(selectedModel?.token_multiplier ?? 1);
  const estimatedRawTokens = Math.ceil(charCount / 4);
  const estimatedTokens = Math.max(1, Math.ceil(estimatedRawTokens * modelMultiplier));
  const estimateOverBudget = estimatedTokens > Math.max(0, tokensRemaining);
  const placeholder = useMemo(() => {
    if (tokensDepleted) {
      return "Tokens esgotados...";
    }
    if (mode === "auto") {
      return "Descreva o objetivo. O WARPION escolhe o melhor modelo...";
    }
    return "Pergunte ao WARPION (Enter envia, Shift+Enter nova linha)";
  }, [mode, tokensDepleted]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled || isStreaming) return;
    onSend(trimmed, attachments);
    setValue("");
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = "44px";
  }

  function resizeTextarea() {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    const maxHeight = 10 * 24;
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`;
  }

  function onTextareaChange(next: string) {
    setValue(next);
    requestAnimationFrame(resizeTextarea);
  }

  function onTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled || isStreaming) return;
    onSend(trimmed, attachments);
    setValue("");
    setAttachments([]);
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = "44px";
    });
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadErrors([]);

    if (attachments.length + files.length > MAX_ATTACHMENTS_PER_MESSAGE) {
      setUploadErrors([
        `Limite de ${MAX_ATTACHMENTS_PER_MESSAGE} arquivos por mensagem.`,
      ]);
      e.target.value = "";
      return;
    }

    const validFiles: File[] = [];
    const nextErrors: string[] = [];
    for (const file of files) {
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      const isMimeAllowed =
        ACCEPTED_MIME_TYPES.has(file.type) ||
        ACCEPTED_EXTENSIONS.includes(ext);
      if (!isMimeAllowed) {
        nextErrors.push(`${file.name}: tipo nao permitido.`);
        continue;
      }
      if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
        nextErrors.push(`${file.name}: excede 50MB.`);
        continue;
      }
      validFiles.push(file);
    }
    if (nextErrors.length > 0) {
      setUploadErrors(nextErrors);
    }
    if (!validFiles.length) {
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const uploaded: ChatAttachment[] = [];
      for (const file of validFiles) {
        setUploadStatus((prev) => [...prev, { name: file.name, status: "uploading" }]);
        const data = new FormData();
        data.append("file", file);
        const res = await fetch("/api/uploads", { method: "POST", body: data });
        const json = (await res.json()) as { data?: ChatAttachment; error?: string };
        if (res.ok && json.data) {
          uploaded.push(json.data);
          setUploadStatus((prev) => prev.filter((entry) => entry.name !== file.name));
        } else {
          setUploadStatus((prev) =>
            prev.map((entry) =>
              entry.name === file.name
                ? { name: file.name, status: "error", error: json.error ?? "Falha no upload." }
                : entry,
            ),
          );
        }
      }
      setAttachments((prev) => [...prev, ...uploaded]);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeAttachment(path: string) {
    setAttachments((prev) => prev.filter((item) => item.path !== path));
  }

  useEffect(() => {
    const focusHandler = () => textareaRef.current?.focus();
    window.addEventListener("warpion:focus-input", focusHandler);
    return () => window.removeEventListener("warpion:focus-input", focusHandler);
  }, []);

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-[900px] px-4 pb-4 md:px-6">
      <div className="flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-3 shadow-[0_0_0_1px_rgba(39,39,42,0.35)]">
        {!!attachments.length && (
          <div className="space-y-2">
            {attachments.map((a) => (
              <div key={a.path} className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/70 px-2 py-1 text-xs text-zinc-200">
                {a.mimeType.startsWith("image/") && a.publicUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.publicUrl} alt={a.name} className="h-10 w-10 rounded-md object-cover" />
                ) : (
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-zinc-800 text-sm">📎</span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate">{a.name}</div>
                  <div className="text-[11px] text-zinc-500">
                    {(a.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(a.path)}
                  className="rounded border border-zinc-600 px-1.5 py-0.5 text-[11px] hover:bg-zinc-800"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {uploadStatus.length > 0 ? (
          <div className="space-y-1 text-xs">
            {uploadStatus.map((entry) => (
              <div key={entry.name} className="rounded-md border border-zinc-700 bg-zinc-900/60 px-2 py-1 text-zinc-300">
                {entry.status === "uploading" ? `Enviando ${entry.name}...` : `${entry.name}: ${entry.error ?? "Falha no upload."}`}
              </div>
            ))}
          </div>
        ) : null}
        {uploadErrors.length > 0 ? (
          <div className="space-y-1 text-xs text-red-300">
            {uploadErrors.map((entry) => (
              <div key={entry}>{entry}</div>
            ))}
          </div>
        ) : null}
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onTextareaChange(e.target.value)}
          onKeyDown={onTextareaKeyDown}
          className="min-h-11 w-full resize-none overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-600"
          placeholder={placeholder}
        />
        {charCount > 500 ? (
          <div className="text-right text-xs text-zinc-500">{charCount.toLocaleString()} chars</div>
        ) : null}
        {charCount > 100 ? (
          <div
            className={`w-fit rounded-md border px-2 py-1 text-xs transition-opacity duration-300 ${
              estimateOverBudget
                ? "border-red-500/50 bg-red-500/10 text-red-300"
                : "border-zinc-700 bg-zinc-900/80 text-zinc-300"
            }`}
          >
            ~{estimatedTokens.toLocaleString("pt-BR")} tokens •{" "}
            {mode === "auto"
              ? "Auto (estimativa base)"
              : `${selectedModel?.display_name ?? "Modelo"} (${modelMultiplier.toFixed(1)}x)`}
          </div>
        ) : null}
        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <label
              aria-label="Anexar arquivos"
              title="Anexar arquivos"
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
            >
              <Paperclip className="h-4 w-4" />
              <input
                type="file"
                className="hidden"
                multiple
                onChange={onFileChange}
                accept="image/png,image/jpeg,image/gif,image/webp,application/pdf,text/plain,text/markdown,text/csv,application/json,.py,.js,.ts,.xlsx,.docx"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setValue((prev) => (prev.trim() ? prev : "/image "));
                requestAnimationFrame(() => textareaRef.current?.focus());
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
              aria-label="Gerar imagem"
              title="Gerar imagem"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
            <VoiceRecorder
              onTranscribed={(text) => {
                setValue((prev) => (prev ? `${prev}\n${text}` : text));
                requestAnimationFrame(resizeTextarea);
                textareaRef.current?.focus();
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-500/60 text-red-300 transition hover:bg-red-500/10"
                title="Parar geração"
                aria-label="Parar geração"
              >
                <Square className="h-3.5 w-3.5" />
              </button>
            ) : null}
            <button
              type="submit"
              disabled={disabled || uploading || isStreaming || !value.trim()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white shadow-[0_8px_30px_rgba(99,102,241,0.35)] transition hover:bg-indigo-500 disabled:opacity-30"
              title={uploading ? "Enviando..." : "Enviar"}
              aria-label={uploading ? "Enviando..." : "Enviar"}
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

