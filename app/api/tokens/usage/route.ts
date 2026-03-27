export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type UsageLogRow = {
  id: string;
  created_at: string;
  model: string | null;
  provider: string | null;
  tool_type: string | null;
  phase: string | null;
  tokens_input: number | null;
  tokens_output: number | null;
};

type ModelCatalogRow = {
  id: string;
  display_name: string | null;
};

function parsePeriod(value: string | null): number {
  switch (value) {
    case "7d":
      return 7;
    case "90d":
      return 90;
    case "30d":
    default:
      return 30;
  }
}

function sumTokens(row: Pick<UsageLogRow, "tokens_input" | "tokens_output">): number {
  return Number(row.tokens_input ?? 0) + Number(row.tokens_output ?? 0);
}

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: "Unauthorized", meta: {} }, { status: 401 });

    const period = parsePeriod(new URL(request.url).searchParams.get("period"));
    const since = new Date();
    since.setDate(since.getDate() - period);

    const [{ data: rows, error: usageError }, { data: catalogRows, error: catalogError }] = await Promise.all([
      supabase
        .from("token_usage_log")
        .select("id, created_at, model, provider, tool_type, phase, tokens_input, tokens_output")
        .eq("user_id", user.id)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false }),
      supabase.from("model_catalog").select("id, display_name"),
    ]);

    if (usageError) throw usageError;
    if (catalogError) throw catalogError;

    const usageRows = (rows ?? []) as UsageLogRow[];
    const modelNameMap = new Map<string, string>(
      ((catalogRows ?? []) as ModelCatalogRow[]).map((row) => [row.id, row.display_name ?? row.id]),
    );

    const totalTokens = usageRows.reduce((acc, row) => acc + sumTokens(row), 0);
    const totalMessages = usageRows.length;
    const avgTokensPerMessage = totalMessages > 0 ? Math.round(totalTokens / totalMessages) : 0;

    const byModelMap = new Map<string, { model: string; provider: string; tokens: number; count: number }>();
    const byToolMap = new Map<string, { tool_type: string; tokens: number; count: number }>();
    const byDayMap = new Map<string, { date: string; tokens: number; count: number }>();

    for (const row of usageRows) {
      const total = sumTokens(row);
      const model = row.model ?? "unknown";
      const provider = row.provider ?? "unknown";
      const tool = row.tool_type ?? "unknown";
      const date = row.created_at.slice(0, 10);

      const modelKey = `${provider}:${model}`;
      const existingModel = byModelMap.get(modelKey) ?? { model, provider, tokens: 0, count: 0 };
      existingModel.tokens += total;
      existingModel.count += 1;
      byModelMap.set(modelKey, existingModel);

      const existingTool = byToolMap.get(tool) ?? { tool_type: tool, tokens: 0, count: 0 };
      existingTool.tokens += total;
      existingTool.count += 1;
      byToolMap.set(tool, existingTool);

      const existingDay = byDayMap.get(date) ?? { date, tokens: 0, count: 0 };
      existingDay.tokens += total;
      existingDay.count += 1;
      byDayMap.set(date, existingDay);
    }

    const byModel = Array.from(byModelMap.values())
      .sort((a, b) => b.tokens - a.tokens)
      .map((entry) => ({
        ...entry,
        display_name: modelNameMap.get(entry.model) ?? entry.model,
        pct: totalTokens > 0 ? Math.round((entry.tokens / totalTokens) * 100) : 0,
      }));

    const byTool = Array.from(byToolMap.values())
      .sort((a, b) => b.tokens - a.tokens)
      .map((entry) => ({
        ...entry,
        pct: totalTokens > 0 ? Math.round((entry.tokens / totalTokens) * 100) : 0,
      }));

    const byDay = Array.from(byDayMap.values()).sort((a, b) => b.date.localeCompare(a.date));

    const recent = usageRows.slice(0, 50).map((row) => ({
      id: row.id,
      created_at: row.created_at,
      model: row.model,
      provider: row.provider,
      tool_type: row.tool_type,
      tokens_input: Number(row.tokens_input ?? 0),
      tokens_output: Number(row.tokens_output ?? 0),
      phase: row.phase ?? "general",
    }));

    return NextResponse.json({
      data: {
        summary: {
          total_tokens: totalTokens,
          total_messages: totalMessages,
          avg_tokens_per_message: avgTokensPerMessage,
          most_used_model: byModel[0]?.model ?? null,
          most_used_tool: byTool[0]?.tool_type ?? null,
        },
        by_model: byModel,
        by_tool: byTool,
        by_day: byDay,
        recent,
      },
      error: null,
      meta: { period: `${period}d` },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load token usage";
    return NextResponse.json({ data: null, error: message, meta: {} }, { status: 500 });
  }
}
