export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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
    await admin.rpc("debit_tokens", {
      p_user_id: user.id,
      p_model_id: "openai-whisper",
      p_tool_type: "chat",
      p_raw_tokens: roughTokens,
    });

    await admin.from("token_usage_log").insert({
      user_id: user.id,
      conversation_id: null,
      model: "openai-whisper",
      provider: "openai",
      tokens_input: roughTokens,
      tokens_output: 0,
      cost_cents: 0,
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
