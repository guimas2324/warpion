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

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("full_name, email, avatar_url, tokens_remaining, tokens_used_total, plan_id")
      .eq("id", user.id)
      .single();
    if (error) throw error;

    return NextResponse.json({ data: profile, error: null, meta: {} });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load profile summary";
    return NextResponse.json({ data: null, error: message, meta: {} }, { status: 500 });
  }
}

