import type { SupabaseClient } from "@supabase/supabase-js";

type ToolType = "chat" | "group_work" | "hard_work" | "automation";

export type DebitTokensArgs = {
  userId: string;
  modelId: string;
  toolType: ToolType;
  rawTokens: number;
};

type DebitRpcResult = {
  success?: boolean;
  debited?: number;
  remaining?: number;
  error?: string;
  message?: string;
  [key: string]: unknown;
};

export async function debitTokensWithFallback(admin: SupabaseClient, args: DebitTokensArgs) {
  const attempts: string[] = [];
  const payloads = [
    {
      signature: "unprefixed",
      payload: {
        user_id: args.userId,
        model_id: args.modelId,
        tool_type: args.toolType,
        raw_tokens: args.rawTokens,
      },
    },
    {
      signature: "prefixed",
      payload: {
        p_user_id: args.userId,
        p_model_id: args.modelId,
        p_tool_type: args.toolType,
        p_raw_tokens: args.rawTokens,
      },
    },
  ] as const;

  for (const attempt of payloads) {
    const { data, error } = await admin.rpc("debit_tokens", attempt.payload);
    if (error) {
      attempts.push(`${attempt.signature}: ${error.message}`);
      continue;
    }

    const debitData = (typeof data === "object" && data ? data : {}) as DebitRpcResult;
    if (debitData.success === false) {
      throw new Error(debitData.error ?? debitData.message ?? "Insufficient tokens");
    }

    return {
      signature: attempt.signature,
      data: debitData,
    };
  }

  throw new Error(`debit_tokens RPC failed for all signatures (${attempts.join(" | ")})`);
}
