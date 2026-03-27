import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", meta: {} }, { status: 401 });

    const { data: convo, error: convoError } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (convoError || !convo) return NextResponse.json({ data: null, error: "Conversation not found", meta: {} }, { status: 404 });

    const { data, error } = await supabase
      .from("messages")
      .select("id, role, content, created_at, attachments")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    if (error) throw error;

    return NextResponse.json({ data: data ?? [], error: null, meta: {} });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load messages";
    return NextResponse.json({ data: null, error: message, meta: {} }, { status: 500 });
  }
}

