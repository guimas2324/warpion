import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollSection } from "@/components/public/ScrollSection";

export function FinalCtaSection() {
  return (
    <ScrollSection className="px-4 py-16 md:px-6">
      <div className="mx-auto w-full max-w-5xl rounded-3xl border border-indigo-500/30 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.25),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(168,85,247,0.25),transparent_35%)] p-8 text-center md:p-12">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100 md:text-4xl">
          Ready to orchestrate?
        </h2>
        <p className="mt-3 text-sm text-zinc-300">
          Start free with 50,000 tokens. No credit card required.
        </p>
        <Link
          href="/register"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500"
        >
          Create free account
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </ScrollSection>
  );
}
