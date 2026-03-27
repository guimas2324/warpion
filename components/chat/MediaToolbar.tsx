"use client";

import { Image as ImageIcon, Volume2, Paperclip } from "lucide-react";

type MediaToolbarProps = {
  onGenerateImage: () => void;
  onGenerateAudio: () => void;
};

export function MediaToolbar({ onGenerateImage, onGenerateAudio }: MediaToolbarProps) {
  return (
    <div className="mx-auto mb-2 flex w-full max-w-[900px] items-center gap-2 px-4 md:px-6">
      <button
        type="button"
        onClick={onGenerateImage}
        className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/70 px-2.5 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-zinc-100"
      >
        <ImageIcon className="h-3.5 w-3.5" />
        Imagem
      </button>
      <button
        type="button"
        onClick={onGenerateAudio}
        className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/70 px-2.5 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-zinc-100"
      >
        <Volume2 className="h-3.5 w-3.5" />
        Áudio
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/70 px-2.5 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-zinc-100"
      >
        <Paperclip className="h-3.5 w-3.5" />
        Arquivo
      </button>
    </div>
  );
}
