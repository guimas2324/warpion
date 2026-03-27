export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const TEST_TOKENS = 50_000;

export async function POST() {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ data: null, error: "Forbidden in production", meta: {} }, { status: 403 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", meta: {} }, { status: 401 });

    const admin = createSupabaseAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("tokens_remaining")
      .eq("id", user.id)
      .single();
    if (profileError) throw profileError;

    const updatedValue = Number(profile.tokens_remaining ?? 0) + TEST_TOKENS;
    const { error: updateError } = await admin
      .from("profiles")
      .update({ tokens_remaining: updatedValue })
      .eq("id", user.id);
    if (updateError) throw updateError;

    return NextResponse.json({
      data: { added: TEST_TOKENS, tokens_remaining: updatedValue },
      error: null,
      meta: {},
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add test tokens";
    return NextResponse.json({ data: null, error: message, meta: {} }, { status: 500 });
  }
}
