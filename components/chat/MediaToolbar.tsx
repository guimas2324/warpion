"use client";

type MediaToolbarProps = {
  onGenerateImage: () => void;
  onGenerateAudio: () => void;
};

export function MediaToolbar({ onGenerateImage, onGenerateAudio }: MediaToolbarProps) {
  return (
    <div className="mb-2 flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/40 px-3 py-2">
      <button
        type="button"
        onClick={onGenerateImage}
        className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-200 hover:bg-zinc-800"
      >
        🎨 Imagem
      </button>
      <button
        type="button"
        onClick={onGenerateAudio}
        className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-200 hover:bg-zinc-800"
      >
        🔊 Audio
      </button>
    </div>
  );
}
