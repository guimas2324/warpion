export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { debitTokensWithFallback } from "@/lib/ai/debit-tokens";
import { ensureSufficientTokens } from "@/lib/ai/token-balance";
import { resolveCostCentsForModel } from "@/lib/ai/cost-cents";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", meta: {} }, { status: 401 });

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ data: null, error: "Audio file is required", meta: {} }, { status: 400 });
    }
    const estimatedTokens = Math.max(300, Math.ceil(file.size / 1024));
    const precheck = await ensureSufficientTokens({
      supabase,
      userId: user.id,
      requiredTokens: estimatedTokens,
    });
    if (!precheck.ok) {
      return NextResponse.json({ data: null, error: "Insufficient tokens", meta: {} }, { status: 402 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const transcript = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "pt",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    });

    const text = transcript.text ?? "";
    const admin = createSupabaseAdminClient();
    const roughTokens = Math.max(1, Math.ceil(text.length / 4));
    await debitTokensWithFallback(admin, {
      userId: user.id,
      modelId: "openai-whisper",
      toolType: "chat",
      rawTokens: roughTokens,
    });
    const costCents = await resolveCostCentsForModel({
      admin,
      modelId: "openai-whisper",
      inputTokens: roughTokens,
      outputTokens: 0,
    });

    await admin.from("token_usage_log").insert({
      user_id: user.id,
      conversation_id: null,
      model: "openai-whisper",
      provider: "openai",
      tokens_input: roughTokens,
      tokens_output: 0,
      cost_cents: costCents,
      tool_type: "chat",
      phase: "general",
      metadata: {
        source_mime: file.type,
        duration: (transcript as { duration?: number }).duration ?? null,
      },
    });

    return NextResponse.json({
      data: {
        text,
        segments: (transcript as { segments?: unknown[] }).segments ?? [],
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to transcribe audio";
    return NextResponse.json({ data: null, error: message, meta: {} }, { status: 500 });
  }
}
