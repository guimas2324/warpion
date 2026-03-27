import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function withTimeout(ms: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("timeout"), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timeout) };
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", meta: {} }, { status: 401 });

    const body = (await request.json()) as { provider: string; api_key: string };
    if (!body.provider || !body.api_key) {
      return NextResponse.json({ data: null, error: "provider and api_key are required", meta: {} }, { status: 400 });
    }

    const provider = body.provider.toLowerCase();
    const looksValid =
      (body.provider === "openai" && body.api_key.startsWith("sk-")) ||
      (body.provider === "anthropic" && body.api_key.startsWith("sk-ant-")) ||
      (body.provider === "google" && body.api_key.startsWith("AIza")) ||
      (body.provider === "deepseek" && body.api_key.startsWith("sk-")) ||
      (body.provider === "xai" && body.api_key.startsWith("xai-"));

    if (!looksValid) {
      return NextResponse.json({ data: { ok: false }, error: "Invalid key format", meta: {} }, { status: 400 });
    }

    const t = withTimeout(10_000);
    try {
      if (provider === "openai") {
        const r = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${body.api_key}` },
          signal: t.signal,
        });
        if (!r.ok) return NextResponse.json({ data: { ok: false }, error: `OpenAI HTTP ${r.status}`, meta: {} }, { status: 400 });
      } else if (provider === "anthropic") {
        const r = await fetch("https://api.anthropic.com/v1/models", {
          headers: {
            "x-api-key": body.api_key,
            "anthropic-version": "2023-06-01",
          },
          signal: t.signal,
        });
        if (!r.ok) return NextResponse.json({ data: { ok: false }, error: `Anthropic HTTP ${r.status}`, meta: {} }, { status: 400 });
      } else if (provider === "google") {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(body.api_key)}`, {
          signal: t.signal,
        });
        if (!r.ok) return NextResponse.json({ data: { ok: false }, error: `Google HTTP ${r.status}`, meta: {} }, { status: 400 });
      } else if (provider === "deepseek") {
        const r = await fetch("https://api.deepseek.com/v1/models", {
          headers: { Authorization: `Bearer ${body.api_key}` },
          signal: t.signal,
        });
        if (!r.ok) return NextResponse.json({ data: { ok: false }, error: `DeepSeek HTTP ${r.status}`, meta: {} }, { status: 400 });
      } else if (provider === "xai") {
        const r = await fetch("https://api.x.ai/v1/models", {
          headers: { Authorization: `Bearer ${body.api_key}` },
          signal: t.signal,
        });
        if (!r.ok) return NextResponse.json({ data: { ok: false }, error: `xAI HTTP ${r.status}`, meta: {} }, { status: 400 });
      } else {
        return NextResponse.json({ data: { ok: false }, error: "Unsupported provider", meta: {} }, { status: 400 });
      }
    } finally {
      t.clear();
    }

    return NextResponse.json({ data: { ok: true }, error: null, meta: {} });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to test key";
    return NextResponse.json({ data: null, error: message, meta: {} }, { status: 500 });
  }
}

