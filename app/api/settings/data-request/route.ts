export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DataRequestBody = {
  type?: "access" | "delete";
};

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", meta: {} }, { status: 401 });

    const body = (await request.json()) as DataRequestBody;
    if (body.type !== "access" && body.type !== "delete") {
      return NextResponse.json({ data: null, error: "Invalid request type", meta: {} }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("data_requests")
      .insert({
        user_id: user.id,
        type: body.type,
        status: "pending",
      })
      .select("id, type, status, created_at")
      .single();

    if (error) {
      return NextResponse.json(
        { data: null, error: "Tabela data_requests indisponível. Configure no banco para ativar LGPD." },
        { status: 500 },
      );
    }

    if (body.type === "delete") {
      await supabase
        .from("profiles")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", user.id);
    }

    return NextResponse.json({ data, error: null, meta: {} });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create data request";
    return NextResponse.json({ data: null, error: message, meta: {} }, { status: 500 });
  }
}
