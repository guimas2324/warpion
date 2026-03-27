export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", meta: {} }, { status: 401 });

    const body = (await request.json()) as { title?: string };
    const title = (body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ data: null, error: "Title is required", meta: {} }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("conversations")
      .update({ title: title.slice(0, 120), updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, title, updated_at")
      .single();

    if (error) throw error;
    return NextResponse.json({ data, error: null, meta: {} });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to rename conversation";
    return NextResponse.json({ data: null, error: message, meta: {} }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", meta: {} }, { status: 401 });

    const { data: convo, error: convoCheckError } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (convoCheckError || !convo) {
      return NextResponse.json({ data: null, error: "Conversation not found", meta: {} }, { status: 404 });
    }

    const { error: messageDeleteError } = await supabase.from("messages").delete().eq("conversation_id", id);
    if (messageDeleteError) throw messageDeleteError;

    const { error: convoDeleteError } = await supabase.from("conversations").delete().eq("id", id).eq("user_id", user.id);
    if (convoDeleteError) throw convoDeleteError;

    return NextResponse.json({ data: { id }, error: null, meta: {} });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete conversation";
    return NextResponse.json({ data: null, error: message, meta: {} }, { status: 500 });
  }
}
