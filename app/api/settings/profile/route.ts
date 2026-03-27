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
      .select("id, email, full_name, avatar_url, tokens_remaining, tokens_used_total, plan_id")
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

    const body = (await request.json()) as { full_name?: string; avatar_url?: string };
    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: body.full_name ?? null,
        avatar_url: body.avatar_url ?? null,
      })
      .eq("id", user.id)
      .select("id, email, full_name, avatar_url, tokens_remaining, tokens_used_total, plan_id")
      .single();
    if (error) throw error;

    return NextResponse.json({ data, error: null, meta: {} });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json({ data: null, error: message, meta: {} }, { status: 500 });
  }
}

