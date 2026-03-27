export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type UsageRow = {
  created_at: string;
  tokens_input: number;
  tokens_output: number;
};

function dayKey(dateIso: string) {
  const d = new Date(dateIso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", meta: {} }, { status: 401 });

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { data, error } = await supabase
      .from("token_usage_log")
      .select("created_at, tokens_input, tokens_output")
      .eq("user_id", user.id)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true });
    if (error) throw error;

    const byDay = new Map<string, number>();
    for (const row of (data ?? []) as UsageRow[]) {
      const key = dayKey(row.created_at);
      byDay.set(key, (byDay.get(key) ?? 0) + Number(row.tokens_input ?? 0) + Number(row.tokens_output ?? 0));
    }

    const daySeries = Array.from(byDay.entries()).map(([date, tokens]) => ({ date, tokens }));
    const totalWeek = daySeries.slice(-7).reduce((acc, item) => acc + item.tokens, 0);

    return NextResponse.json({ data: { daySeries, totalWeek }, error: null, meta: {} });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load usage";
    return NextResponse.json({ data: null, error: message, meta: {} }, { status: 500 });
  }
}

