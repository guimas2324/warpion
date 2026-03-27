export type SettingsTab = "profile" | "plan" | "usage" | "privacy";

export type ProfileData = {
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  tokens_remaining: number;
  tokens_used_total: number;
  consent_at?: string | null;
  deleted_at?: string | null;
  last_login_at?: string | null;
  login_count?: number | null;
  preferences?: Record<string, unknown> | null;
};

export type PlanData = {
  plan: { id?: string; name?: string; display_name: string; tokens_monthly: number; price_cents: number };
  tokens_remaining: number;
  tokens_used_total: number;
};

export type UsagePayload = {
  summary: {
    total_tokens: number;
    total_messages: number;
    avg_tokens_per_message: number;
    most_used_model: string | null;
    most_used_tool: string | null;
  };
  by_model: Array<{ model: string; provider: string; display_name: string; tokens: number; count: number; pct: number }>;
  by_tool: Array<{ tool_type: string; tokens: number; count: number; pct: number }>;
  by_day: Array<{ date: string; tokens: number; count: number }>;
  recent: Array<{
    id: string;
    created_at: string;
    model: string | null;
    provider: string | null;
    tool_type: string | null;
    tokens_input: number;
    tokens_output: number;
    phase: string;
  }>;
};

export type PurchaseItem = {
  id: string;
  tokens_amount: number;
  price_cents: number;
  status: string;
  payment_method: string | null;
  created_at: string;
};

export type DataRequestItem = {
  type: "access" | "delete";
  status: string;
  created_at: string;
  resolved_at?: string | null;
};
