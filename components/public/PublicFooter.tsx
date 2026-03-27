import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 md:grid-cols-4 md:px-6">
        <div>
          <div className="mb-2 text-sm font-bold text-zinc-100">WARPION</div>
          <p className="text-xs text-zinc-400">
            Orquestração multi-IA com Intelligence Engine para resultados superiores.
          </p>
        </div>
        <div>
          <div className="mb-2 text-sm font-semibold text-zinc-200">Produto</div>
          <div className="space-y-1 text-xs text-zinc-400">
            <a href="#produto" className="block hover:text-zinc-200">
              Ferramentas
            </a>
            <a href="#engine" className="block hover:text-zinc-200">
              Intelligence Engine
            </a>
            <Link href="/pricing" className="block hover:text-zinc-200">
              Preços
            </Link>
          </div>
        </div>
        <div>
          <div className="mb-2 text-sm font-semibold text-zinc-200">Empresa</div>
          <div className="space-y-1 text-xs text-zinc-400">
            <a href="#" className="block hover:text-zinc-200">
              Blog
            </a>
            <a href="#" className="block hover:text-zinc-200">
              Contato
            </a>
            <a href="#" className="block hover:text-zinc-200">
              Sobre
            </a>
          </div>
        </div>
        <div>
          <div className="mb-2 text-sm font-semibold text-zinc-200">Legal</div>
          <div className="space-y-1 text-xs text-zinc-400">
            <Link href="/terms" className="block hover:text-zinc-200">
              Termos de Uso
            </Link>
            <Link href="/privacy" className="block hover:text-zinc-200">
              Política de Privacidade
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-zinc-800 px-4 py-4 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} WARPION. Todos os direitos reservados.
      </div>
    </footer>
  );
}
