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
      .from("group_work_specialties")
      .select("specialty, display_name, model_1, model_1_role, model_2, model_2_role, model_3, model_3_role, icon")
      .order("display_name");
    if (error) throw error;

    return NextResponse.json({ data: data ?? [], error: null, meta: {} });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load specialties";
    return NextResponse.json({ data: null, error: message, meta: {} }, { status: 500 });
  }
}

