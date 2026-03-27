export type PublicPlan = {
  id: "free" | "starter" | "pro" | "enterprise";
  displayName: string;
  priceBrlMonthly: number;
  tokensMonthly: number;
  chat: boolean;
  groupWork: boolean;
  hardWork: boolean;
  automation: boolean;
  agents: boolean;
  apiAccess: boolean;
  sso: boolean;
  dedicatedSupport: boolean;
};

export const PUBLIC_PLANS: PublicPlan[] = [
  {
    id: "free",
    displayName: "Free",
    priceBrlMonthly: 0,
    tokensMonthly: 50_000,
    chat: true,
    groupWork: false,
    hardWork: false,
    automation: false,
    agents: false,
    apiAccess: false,
    sso: false,
    dedicatedSupport: false,
  },
  {
    id: "starter",
    displayName: "Starter",
    priceBrlMonthly: 19.9,
    tokensMonthly: 500_000,
    chat: true,
    groupWork: true,
    hardWork: false,
    automation: false,
    agents: false,
    apiAccess: false,
    sso: false,
    dedicatedSupport: false,
  },
  {
    id: "pro",
    displayName: "Pro",
    priceBrlMonthly: 49.9,
    tokensMonthly: 2_000_000,
    chat: true,
    groupWork: true,
    hardWork: true,
    automation: true,
    agents: true,
    apiAccess: false,
    sso: false,
    dedicatedSupport: false,
  },
  {
    id: "enterprise",
    displayName: "Enterprise",
    priceBrlMonthly: 149.9,
    tokensMonthly: 10_000_000,
    chat: true,
    groupWork: true,
    hardWork: true,
    automation: true,
    agents: true,
    apiAccess: true,
    sso: true,
    dedicatedSupport: true,
  },
];

export function formatBrl(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: value === 0 ? 0 : 2,
  }).format(value);
}
