import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WARPION — Política de Privacidade",
  description: "Como a WARPION trata seus dados conforme a LGPD.",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto w-full max-w-4xl px-4 py-12 md:px-6">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-100">Política de Privacidade</h1>
      <p className="mt-2 text-sm text-zinc-500">Última atualização: 27/03/2026</p>

      <div className="prose prose-invert mt-8 max-w-none prose-p:text-zinc-300 prose-headings:text-zinc-100">
        <h2 id="dados-coletados">Dados coletados</h2>
        <p>Coletamos dados de conta (email, nome), uso da plataforma, conversas e métricas de consumo de tokens.</p>
        <h2 id="uso-dados">Como usamos os dados</h2>
        <p>Usamos dados para autenticação, execução de recursos de IA, billing, segurança e melhoria da qualidade do serviço.</p>
        <h2 id="processadores">Processadores de IA</h2>
        <p>Dependendo do modelo selecionado, mensagens podem ser processadas por OpenAI, Anthropic, Google, DeepSeek e xAI.</p>
        <h2 id="lgpd">Seus direitos LGPD</h2>
        <p>Você pode solicitar acesso, correção e exclusão de dados pela aba de Privacidade em Settings.</p>
        <h2 id="contato">Contato</h2>
        <p>Para solicitações de privacidade, entre em contato em privacy@warpionai.com.</p>
      </div>
    </article>
  );
}
