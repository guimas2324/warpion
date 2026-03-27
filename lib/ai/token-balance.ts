import type { SupabaseClient } from "@supabase/supabase-js";

export async function ensureSufficientTokens(params: {
  supabase: SupabaseClient;
  userId: string;
  requiredTokens: number;
}) {
  const { supabase, userId, requiredTokens } = params;
  const { data, error } = await supabase
    .from("profiles")
    .select("tokens_remaining")
    .eq("id", userId)
    .single();

  if (error) throw error;

  const remaining = Number(data.tokens_remaining ?? 0);
  return {
    remaining,
    required: Math.max(0, Math.floor(requiredTokens)),
    ok: remaining >= Math.max(0, Math.floor(requiredTokens)),
  };
}
