import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WARPION — Termos de Uso",
  description: "Termos de uso da plataforma WARPION.",
};

export default function TermsPage() {
  return (
    <article className="mx-auto w-full max-w-4xl px-4 py-12 md:px-6">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-100">Termos de Uso</h1>
      <p className="mt-2 text-sm text-zinc-500">Última atualização: 27/03/2026</p>

      <div className="prose prose-invert mt-8 max-w-none prose-p:text-zinc-300 prose-headings:text-zinc-100">
        <h2 id="uso-aceitavel">Uso aceitável</h2>
        <p>É proibido usar a plataforma para atividades ilegais, abuso, spam ou violação de direitos de terceiros.</p>
        <h2 id="tokens">Tokens e planos</h2>
        <p>Tokens mensais seguem regras do plano contratado. Compras avulsas não são reembolsáveis.</p>
        <h2 id="responsabilidade">Responsabilidade da conta</h2>
        <p>Você é responsável por proteger suas credenciais e por toda atividade realizada na sua conta.</p>
        <h2 id="propriedade">Propriedade intelectual</h2>
        <p>Conteúdo gerado pertence ao usuário, respeitados direitos de terceiros e legislação aplicável.</p>
        <h2 id="limitacao">Limitação de responsabilidade</h2>
        <p>O serviço é fornecido em base de melhor esforço, com recursos adicionais de SLA em planos enterprise.</p>
      </div>
    </article>
  );
}
