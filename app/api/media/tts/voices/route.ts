export const runtime = "nodejs";

import { NextResponse } from "next/server";

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
