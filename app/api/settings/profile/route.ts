export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", meta: {} }, { status: 401 });

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, email, full_name, avatar_url, tokens_remaining, tokens_used_total, plan_id, consent_at, deleted_at, last_login_at, login_count, preferences",
      )
      .eq("id", user.id)
      .single();
    if (error) throw error;

    return NextResponse.json({ data, error: null, meta: {} });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load profile";
    return NextResponse.json({ data: null, error: message, meta: {} }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", meta: {} }, { status: 401 });

    const body = (await request.json()) as {
      full_name?: string;
      avatar_url?: string;
      consent_at?: string;
      consent_version?: string;
      deactivate?: boolean;
    };
    const nextPreferences =
      typeof body.consent_version === "string"
        ? ({ consent_version: body.consent_version } as Record<string, unknown>)
        : undefined;
    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: body.full_name ?? null,
        avatar_url: body.avatar_url ?? null,
        consent_at: body.consent_at ?? undefined,
        deleted_at: body.deactivate ? new Date().toISOString() : undefined,
        preferences: nextPreferences,
      })
      .eq("id", user.id)
      .select(
        "id, email, full_name, avatar_url, tokens_remaining, tokens_used_total, plan_id, consent_at, deleted_at, last_login_at, login_count, preferences",
      )
      .single();
    if (error) throw error;

    return NextResponse.json({ data, error: null, meta: {} });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json({ data: null, error: message, meta: {} }, { status: 500 });
  }
}

