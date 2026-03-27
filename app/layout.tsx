import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WARPION — Orquestração Multi-IA com Intelligence Engine",
  description:
    "Combine OpenAI, Anthropic, Google, DeepSeek e xAI em um sistema com otimização automática para Chat, Group Work, Hard Work e Automação.",
  keywords: [
    "IA",
    "inteligência artificial",
    "multi-IA",
    "ChatGPT alternativa",
    "Claude",
    "Gemini",
    "orquestração IA",
  ],
  metadataBase: new URL("https://warpionai.com"),
  openGraph: {
    title: "WARPION — Orquestração Multi-IA",
    description: "16+ modelos de IA em 4 ferramentas com Intelligence Engine",
    url: "https://warpionai.com",
    siteName: "WARPION",
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "WARPION — Orquestração Multi-IA",
    description: "16+ modelos de IA em 4 ferramentas com Intelligence Engine",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
