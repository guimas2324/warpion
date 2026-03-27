export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { encryptSecret } from "@/lib/security/secrets";

const PROVIDERS = ["openai", "anthropic", "google", "deepseek", "xai"] as const;

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", meta: {} }, { status: 401 });

    const { data, error } = await supabase
      .from("user_api_keys")
      .select("id, provider, key_hint, is_active, last_used_at")
      .eq("user_id", user.id)
      .order("provider");
    if (error) throw error;

    return NextResponse.json({ data: data ?? [], error: null, meta: {} });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load keys";
    return NextResponse.json({ data: null, error: message, meta: {} }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", meta: {} }, { status: 401 });

    const body = (await request.json()) as { provider: string; api_key: string; is_active?: boolean };
    const provider = body.provider.toLowerCase();
    if (!PROVIDERS.includes(provider as (typeof PROVIDERS)[number])) {
      return NextResponse.json({ data: null, error: "Unsupported provider", meta: {} }, { status: 400 });
    }
    if (!body.api_key?.trim()) {
      return NextResponse.json({ data: null, error: "api_key is required", meta: {} }, { status: 400 });
    }

    const encrypted = encryptSecret(body.api_key.trim());
    const keyHint = `${body.api_key.slice(0, 4)}...${body.api_key.slice(-4)}`;

    const { data, error } = await supabase
      .from("user_api_keys")
      .upsert(
        {
          user_id: user.id,
          provider,
          encrypted_key: encrypted,
          key_hint: keyHint,
          is_active: body.is_active ?? true,
        },
        { onConflict: "user_id,provider" },
      )
      .select("id, provider, key_hint, is_active, last_used_at")
      .single();
    if (error) throw error;

    return NextResponse.json({ data, error: null, meta: {} });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save key";
    return NextResponse.json({ data: null, error: message, meta: {} }, { status: 500 });
  }
}

