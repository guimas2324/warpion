"use client";

import { useMemo, useRef, useState } from "react";

type AudioPlayerProps = {
  url: string;
};

function formatTime(seconds: number) {
  const safe = Number.isFinite(seconds) ? Math.floor(seconds) : 0;
  const m = Math.floor(safe / 60);
  const s = String(safe % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function AudioPlayer({ url }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);

  const progress = useMemo(() => (duration > 0 ? (time / duration) * 100 : 0), [duration, time]);

  return (
    <div className="mt-2 rounded-xl border border-zinc-700 bg-zinc-900/50 p-2 text-xs text-zinc-200">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={() => setTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => setPlaying(false)}
      />
      <div className="mb-2 flex items-center gap-2">
        <button
          onClick={() => {
            if (!audioRef.current) return;
            if (playing) {
              audioRef.current.pause();
              setPlaying(false);
            } else {
              void audioRef.current.play();
              setPlaying(true);
            }
          }}
          className="rounded border border-zinc-600 px-2 py-1 hover:bg-zinc-800"
        >
          {playing ? "Pause" : "Play"}
        </button>
        <select
          value={speed}
          onChange={(e) => {
            const next = Number(e.target.value);
            setSpeed(next);
            if (audioRef.current) audioRef.current.playbackRate = next;
          }}
          className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1"
        >
          {[0.5, 1, 1.5, 2].map((item) => (
            <option key={item} value={item}>
              {item}x
            </option>
          ))}
        </select>
        <a href={url} download target="_blank" rel="noreferrer" className="rounded border border-zinc-600 px-2 py-1 hover:bg-zinc-800">
          Download
        </a>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800">
        <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-1 text-[11px] text-zinc-400">
        {formatTime(time)} / {formatTime(duration)}
      </div>
    </div>
  );
}
