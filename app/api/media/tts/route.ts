export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type TtsBody = {
  text?: string;
  model?: "openai-tts" | "elevenlabs-tts";
  voice?: string;
};

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", meta: {} }, { status: 401 });

    const body = (await request.json()) as TtsBody;
    const text = (body.text ?? "").trim();
    if (!text) {
      return NextResponse.json({ data: null, error: "Text is required", meta: {} }, { status: 400 });
    }

    const selectedModel = body.model ?? "openai-tts";
    const admin = createSupabaseAdminClient();
    let audioBuffer: Buffer;
    let contentType = "audio/mpeg";

    if (selectedModel === "openai-tts") {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.audio.speech.create({
        model: "tts-1-hd",
        voice: (body.voice as
          | "alloy"
          | "ash"
          | "ballad"
          | "coral"
          | "echo"
          | "fable"
          | "nova"
          | "onyx"
          | "sage"
          | "shimmer"
          | undefined) ?? "nova",
        input: text,
        response_format: "mp3",
      });
      audioBuffer = Buffer.from(await response.arrayBuffer());
    } else {
      const voiceId = body.voice ?? "21m00Tcm4TlvDq8ikWAM";
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`ElevenLabs failed: ${errorBody}`);
      }
      contentType = response.headers.get("content-type") ?? "audio/mpeg";
      audioBuffer = Buffer.from(await response.arrayBuffer());
    }

    const extension = contentType.includes("wav") ? "wav" : "mp3";
    const path = `${user.id}/audio/${Date.now()}_${selectedModel}.${extension}`;
    const { error: uploadError } = await admin.storage.from("chat-attachments").upload(path, audioBuffer, {
      contentType,
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data: publicData } = admin.storage.from("chat-attachments").getPublicUrl(path);
    const modelId = selectedModel === "openai-tts" ? "openai-tts" : "elevenlabs-tts";
    const roughTokens = Math.max(1, Math.ceil(text.length / 4));
    await admin.rpc("debit_tokens", {
      p_user_id: user.id,
      p_model_id: modelId,
      p_tool_type: "chat",
      p_raw_tokens: roughTokens,
    });

    await admin.from("token_usage_log").insert({
      user_id: user.id,
      conversation_id: null,
      model: modelId,
      provider: selectedModel === "openai-tts" ? "openai" : "elevenlabs",
      tokens_input: roughTokens,
      tokens_output: 0,
      cost_cents: 0,
      tool_type: "chat",
      phase: "general",
      metadata: {
        text_preview: text.slice(0, 300),
      },
    });

    return NextResponse.json({
      data: {
        url: publicData.publicUrl,
        model: modelId,
        voice: body.voice ?? (selectedModel === "openai-tts" ? "nova" : "default"),
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate audio";
    return NextResponse.json({ data: null, error: message, meta: {} }, { status: 500 });
  }
}
