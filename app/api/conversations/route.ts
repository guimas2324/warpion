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
      .from("conversations")
      .select("id, title, mode, model_used, updated_at, created_at, tool_type")
      .eq("user_id", user.id)
      .eq("tool_type", "chat")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json({ data: data ?? [], error: null, meta: {} });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load conversations";
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

    const body = (await request.json()) as { title?: string };
    const title = (body.title || "New chat").slice(0, 120);

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        tool_type: "chat",
        title,
        mode: "auto",
        status: "active",
      })
      .select("id, title, mode, model_used, updated_at, created_at, tool_type")
      .single();

    if (error) throw error;
    return NextResponse.json({ data, error: null, meta: {} }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create conversation";
    return NextResponse.json({ data: null, error: message, meta: {} }, { status: 500 });
  }
}

