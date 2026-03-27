import Link from "next/link";
import { Globe, Send, Building2 } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 md:grid-cols-4 md:px-6">
        <div>
          <div className="mb-2 text-sm font-bold text-zinc-100">WARPION</div>
          <p className="text-xs text-zinc-400">
            Orchestrate multiple AIs with one intelligent execution layer.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <a href="#" className="rounded-md border border-zinc-800 p-1.5 text-zinc-500 hover:text-zinc-300">
              <Globe className="h-3.5 w-3.5" />
            </a>
            <a href="#" className="rounded-md border border-zinc-800 p-1.5 text-zinc-500 hover:text-zinc-300">
              <Send className="h-3.5 w-3.5" />
            </a>
            <a href="#" className="rounded-md border border-zinc-800 p-1.5 text-zinc-500 hover:text-zinc-300">
              <Building2 className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
        <div>
          <div className="mb-2 text-sm font-semibold text-zinc-200">Produto</div>
          <div className="space-y-1 text-xs text-zinc-400">
            <a href="#produto" className="block hover:text-zinc-200">
              Tools
            </a>
            <a href="#engine" className="block hover:text-zinc-200">
              Intelligence Engine
            </a>
            <Link href="/pricing" className="block hover:text-zinc-200">
              Pricing
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
              Contact
            </a>
          </div>
        </div>
        <div>
          <div className="mb-2 text-sm font-semibold text-zinc-200">Legal</div>
          <div className="space-y-1 text-xs text-zinc-400">
            <Link href="/terms" className="block hover:text-zinc-200">
              Terms
            </Link>
            <Link href="/privacy" className="block hover:text-zinc-200">
              Privacy
            </Link>
            <span className="block">LGPD</span>
          </div>
        </div>
      </div>
      <div className="border-t border-zinc-800 px-4 py-4 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} WARPION. All rights reserved.
      </div>
    </footer>
  );
}
