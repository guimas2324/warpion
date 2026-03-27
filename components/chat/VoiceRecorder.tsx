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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => setSeconds((prev) => prev + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    chunksRef.current = [];
    streamRef.current = stream;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setSeconds(0);
    setRecording(true);
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
        console.warn(payload.error ?? "Falha ao transcrever audio.");
      }
    } finally {
      setProcessing(false);
    }
  }

  return (
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
      className={`inline-flex h-11 items-center rounded-xl border px-3 text-sm ${
        recording
          ? "border-red-500/60 bg-red-500/10 text-red-300"
          : "border-zinc-700 text-zinc-200 hover:bg-zinc-900/50"
      }`}
    >
      {processing ? "⏳" : recording ? `🔴 ${formatDuration(seconds)}` : "🎙️"}
    </button>
  );
}
