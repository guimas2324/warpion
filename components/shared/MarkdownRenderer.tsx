"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { CodeBlock } from "@/components/shared/CodeBlock";

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-zinc max-w-none dark:prose-invert prose-headings:text-zinc-100 prose-p:text-zinc-200 prose-a:text-indigo-300 prose-strong:text-zinc-100 prose-li:text-zinc-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code({ className, children, ...props }) {
            const text = String(children).replace(/\n$/, "");
            const match = /language-(\w+)/.exec(className || "");
            if (!className) {
              return (
                <code
                  {...props}
                  className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[0.85em] text-zinc-100"
                >
                  {children}
                </code>
              );
            }
            return <CodeBlock code={text} language={match?.[1]} />;
          },
          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto rounded-xl border border-zinc-700">
                <table className="w-full border-collapse text-sm">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return <th className="border-b border-zinc-700 bg-zinc-900/70 px-3 py-2 text-left text-zinc-100">{children}</th>;
          },
          td({ children }) {
            return <td className="border-b border-zinc-800 px-3 py-2 text-zinc-200">{children}</td>;
          },
          blockquote({ children }) {
            return <blockquote className="my-4 border-l-4 border-indigo-500 bg-zinc-900/50 px-4 py-2 text-zinc-200">{children}</blockquote>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

