"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const current = window.scrollY;
      setHidden(current > last && current > 100);
      last = current;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl transition-transform duration-300 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white">
            W
          </span>
          <span className="text-sm font-bold tracking-wide text-zinc-100">WARPION</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-zinc-300 md:flex">
          <a href="#produto" className="hover:text-zinc-100">
            Produto
          </a>
          <Link href="/pricing" className="hover:text-zinc-100">
            Preços
          </Link>
          <a href="#engine" className="hover:text-zinc-100">
            Intelligence Engine
          </a>
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800">
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500"
          >
            Começar Grátis
          </Link>
        </div>
        <button
          aria-label="Abrir menu"
          className="rounded-lg border border-zinc-700 px-2 py-1 text-sm text-zinc-200 md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          ☰
        </button>
      </div>
      {open ? (
        <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2 text-sm">
            <a href="#produto" className="rounded-md px-2 py-1 text-zinc-300 hover:bg-zinc-800">
              Produto
            </a>
            <Link href="/pricing" className="rounded-md px-2 py-1 text-zinc-300 hover:bg-zinc-800">
              Preços
            </Link>
            <a href="#engine" className="rounded-md px-2 py-1 text-zinc-300 hover:bg-zinc-800">
              Intelligence Engine
            </a>
            <Link href="/login" className="rounded-md px-2 py-1 text-zinc-300 hover:bg-zinc-800">
              Login
            </Link>
            <Link href="/register" className="rounded-md bg-indigo-600 px-2 py-1 text-center text-white">
              Começar Grátis
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
