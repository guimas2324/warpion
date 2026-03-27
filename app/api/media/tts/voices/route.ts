export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const OPENAI_VOICES = [
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "nova",
  "onyx",
  "sage",
  "shimmer",
];

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized", meta: {} }, { status: 401 });
    }

    try {
      const admin = createSupabaseAdminClient();
      const { data: allowed, error: rateError } = await admin.schema("private").rpc("check_rate_limit", {
        user_id: user.id,
        ip: "0.0.0.0",
        endpoint: "/api/media/tts/voices",
        max_requests: 60,
        window_minutes: 5,
      });
      if (!rateError && !allowed) {
        return NextResponse.json({ data: null, error: "Rate limit exceeded", meta: {} }, { status: 429 });
      }
    } catch (rateCheckError) {
      console.warn("Rate-limit check unavailable for tts voices endpoint:", rateCheckError);
    }

    let elevenlabsVoices: Array<{ id: string; name: string }> = [];
    if (process.env.ELEVENLABS_API_KEY) {
      const response = await fetch("https://api.elevenlabs.io/v1/voices", {
        headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY },
      });
      if (response.ok) {
        const payload = (await response.json()) as {
          voices?: Array<{ voice_id?: string; name?: string }>;
        };
        elevenlabsVoices = (payload.voices ?? []).map((voice) => ({
          id: voice.voice_id ?? "",
          name: voice.name ?? "Voice",
        }));
      }
    }

    return NextResponse.json({
      data: {
        openai: OPENAI_VOICES,
        elevenlabs: elevenlabsVoices,
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load voices";
    return NextResponse.json({ data: null, error: message, meta: {} }, { status: 500 });
  }
}
