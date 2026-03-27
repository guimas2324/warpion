export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized", meta: {} }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("model_catalog")
      .select("id, provider, litellm_id, display_name, description, is_active, supports_streaming, supports_vision, supports_tools, speed_tier")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data: data ?? [], error: null, meta: {} });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load models";
    return NextResponse.json({ data: null, error: message, meta: {} }, { status: 500 });
  }
}

