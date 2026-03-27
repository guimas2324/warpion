"use client";

type ImageGenerationCardProps = {
  imageUrl: string;
  model: string;
  prompt?: string;
};

export function ImageGenerationCard({ imageUrl, model, prompt }: ImageGenerationCardProps) {
  return (
    <div className="w-full max-w-[520px] rounded-xl border border-zinc-700 bg-zinc-950 p-3">
      <div className="mb-2 flex items-center justify-between text-xs text-zinc-300">
        <span>Imagem gerada</span>
        <span>{model}</span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt="Generated" className="w-full rounded-lg border border-zinc-700 object-cover" />
      <div className="mt-2 text-[11px] text-zinc-500">1024x1024 • PNG</div>
      {prompt ? <div className="mt-1 line-clamp-2 text-[11px] text-zinc-400">{prompt}</div> : null}
      <div className="mt-3 flex gap-2 text-xs">
        <a
          href={imageUrl}
          download
          target="_blank"
          rel="noreferrer"
          className="rounded border border-zinc-600 px-2 py-1 hover:bg-zinc-800"
        >
          Download
        </a>
      </div>
    </div>
  );
}
