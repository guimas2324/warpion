export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ImageRequestBody = {
  prompt?: string;
  model?: "gpt-image" | "gemini-imagen";
  size?: "1024x1024" | "1536x1024" | "1024x1536" | "auto";
  quality?: "low" | "medium" | "high";
};

function toDataUrl(base64: string, mimeType = "image/png") {
  return `data:${mimeType};base64,${base64}`;
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", meta: {} }, { status: 401 });

    const body = (await request.json()) as ImageRequestBody;
    const prompt = (body.prompt ?? "").trim();
    if (!prompt) {
      return NextResponse.json({ data: null, error: "Prompt is required", meta: {} }, { status: 400 });
    }
    const selectedModel = body.model ?? "gpt-image";
    const admin = createSupabaseAdminClient();

    let base64: string | undefined;
    if (selectedModel === "gpt-image") {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const image = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: body.size ?? "1024x1024",
        quality: body.quality ?? "medium",
      });
      base64 = image.data?.[0]?.b64_json ?? undefined;
    } else {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            instances: [{ prompt }],
            parameters: { sampleCount: 1, aspectRatio: "1:1" },
          }),
        },
      );
      const payload = (await response.json()) as {
        predictions?: Array<{ bytesBase64Encoded?: string }>;
      };
      base64 = payload.predictions?.[0]?.bytesBase64Encoded;
    }

    if (!base64) {
      return NextResponse.json({ data: null, error: "Image generation failed", meta: {} }, { status: 502 });
    }

    const bytes = Buffer.from(base64, "base64");
    const path = `${user.id}/generated/${Date.now()}_${selectedModel}.png`;
    const { error: uploadError } = await admin.storage.from("chat-attachments").upload(path, bytes, {
      contentType: "image/png",
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data: publicData } = admin.storage.from("chat-attachments").getPublicUrl(path);

    const modelId = selectedModel === "gpt-image" ? "gpt-image" : "gemini-imagen";
    await admin.rpc("debit_tokens", {
      p_user_id: user.id,
      p_model_id: modelId,
      p_tool_type: "chat",
      p_raw_tokens: 1000,
    });

    await admin.from("token_usage_log").insert({
      user_id: user.id,
      conversation_id: null,
      model: modelId,
      provider: selectedModel === "gpt-image" ? "openai" : "google",
      tokens_input: 500,
      tokens_output: 500,
      cost_cents: 0,
      tool_type: "chat",
      phase: "asset_analysis",
      metadata: {
        prompt_preview: prompt.slice(0, 300),
      },
    });

    return NextResponse.json({
      data: {
        url: publicData.publicUrl,
        model: modelId,
        prompt,
        preview_data_url: toDataUrl(base64),
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate image";
    return NextResponse.json({ data: null, error: message, meta: {} }, { status: 500 });
  }
}
