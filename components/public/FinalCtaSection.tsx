import Link from "next/link";

export function FinalCtaSection() {
  return (
    <section className="px-4 py-14 md:px-6">
      <div className="mx-auto w-full max-w-5xl rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-600/20 via-violet-600/20 to-purple-600/20 p-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100 md:text-4xl">
          Pronto para orquestrar?
        </h2>
        <p className="mt-3 text-sm text-zinc-300">
          Comece grátis com 50.000 tokens. Sem cartão de crédito.
        </p>
        <Link
          href="/register"
          className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500"
        >
          Criar Conta Grátis
        </Link>
      </div>
    </section>
  );
}
