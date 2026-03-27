"use client";

import { useEffect, useRef, useState } from "react";

type VoiceRecorderProps = {
  onTranscribed: (text: string) => void;
};

function formatDuration(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function VoiceRecorder({ onTranscribed }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => setSeconds((prev) => prev + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  async function startRecording() {
    setError(null);
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("Gravação de áudio não suportada neste navegador.");
      }

      const preferredMimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
      const mimeType = preferredMimeTypes.find((item) => MediaRecorder.isTypeSupported(item));
      if (!mimeType) {
        throw new Error("Codec de áudio não suportado no navegador atual.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      streamRef.current = stream;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setSeconds(0);
      setRecording(true);
    } catch (err) {
      setRecording(false);
      setProcessing(false);
      setError(err instanceof Error ? err.message : "Não foi possível iniciar a gravação.");
    }
  }

  async function stopRecording() {
    if (!mediaRecorderRef.current) return;
    setRecording(false);
    setProcessing(true);
    await new Promise<void>((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) {
        resolve();
        return;
      }
      recorder.onstop = () => resolve();
      recorder.stop();
    });
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const form = new FormData();
    form.append("file", blob, "recording.webm");
    try {
      const response = await fetch("/api/media/stt", { method: "POST", body: form });
      const payload = (await response.json()) as { data?: { text?: string }; error?: string };
      if (response.ok && payload.data?.text) {
        onTranscribed(payload.data.text);
      } else {
        setError(payload.error ?? "Falha ao transcrever áudio.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar áudio.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => {
          if (processing) return;
          if (!recording) {
            void startRecording();
          } else {
            void stopRecording();
          }
        }}
        aria-label={recording ? "Parar gravação de voz" : "Iniciar gravação de voz"}
        title={recording ? "Parar gravação de voz" : "Iniciar gravação de voz"}
        className={`inline-flex h-11 items-center rounded-xl border px-3 text-sm ${
          recording
            ? "border-red-500/60 bg-red-500/10 text-red-300"
            : "border-zinc-700 text-zinc-200 hover:bg-zinc-900/50"
        }`}
      >
        {processing ? "⏳" : recording ? `🔴 ${formatDuration(seconds)}` : "🎙️"}
      </button>
      {error ? <div className="max-w-44 text-[11px] text-red-300">{error}</div> : null}
    </div>
  );
}
