export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ConversationRow = {
  id: string;
  title: string;
  mode: string | null;
  model_used: string | null;
  updated_at: string | null;
  created_at: string | null;
  tool_type: string | null;
};

type MessagePreviewRow = {
  conversation_id: string;
  content: string | null;
  created_at: string | null;
  model: string | null;
  provider: string | null;
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit") ?? 20)));
    const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0));

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", meta: {} }, { status: 401 });

    let query = supabase
      .from("conversations")
      .select("id, title, mode, model_used, updated_at, created_at, tool_type", { count: "exact" })
      .eq("user_id", user.id)
      .eq("tool_type", "chat")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (q) query = query.ilike("title", `%${q}%`);

    const { data, error, count } = await query;

    if (error) throw error;

    const conversations = (data ?? []) as ConversationRow[];
    const ids = conversations.map((row) => row.id);
    const previewMap = new Map<string, MessagePreviewRow>();

    if (ids.length > 0) {
      const { data: previewRows, error: previewError } = await supabase
        .from("messages")
        .select("conversation_id, content, created_at, model, provider")
        .in("conversation_id", ids)
        .order("created_at", { ascending: false });

      if (previewError) throw previewError;
      for (const row of (previewRows ?? []) as MessagePreviewRow[]) {
        if (!previewMap.has(row.conversation_id)) {
          previewMap.set(row.conversation_id, row);
        }
      }
    }

    const payload = conversations.map((row) => {
      const preview = previewMap.get(row.id);
      return {
        ...row,
        preview: (preview?.content ?? "").slice(0, 120),
        provider: preview?.provider ?? null,
        last_message_at: preview?.created_at ?? row.updated_at ?? row.created_at,
      };
    });

    const total = Number(count ?? payload.length);
    return NextResponse.json({
      data: payload,
      error: null,
      meta: {
        limit,
        offset,
        total,
        has_more: offset + payload.length < total,
      },
    });
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

