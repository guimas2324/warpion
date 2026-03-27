import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", meta: {} }, { status: 401 });

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("plan_id, tokens_remaining, tokens_used_total")
      .eq("id", user.id)
      .single();
    if (profileError) throw profileError;

    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("id, name, display_name, tokens_monthly, price_cents")
      .eq("id", profile.plan_id)
      .single();
    if (planError) throw planError;

    return NextResponse.json({
      data: {
        plan,
        tokens_remaining: profile.tokens_remaining,
        tokens_used_total: profile.tokens_used_total,
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load plan";
    return NextResponse.json({ data: null, error: message, meta: {} }, { status: 500 });
  }
}

