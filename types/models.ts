export type ModelCatalogItem = {
  id: string;
  provider: string;
  litellm_id: string | null;
  display_name: string;
  description: string | null;
  is_active: boolean;
  supports_streaming: boolean | null;
  supports_vision: boolean | null;
  supports_tools: boolean | null;
  speed_tier: "fast" | "normal" | "slow" | null;
};

