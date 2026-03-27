export const TOKEN_PACKAGES = [
  { tokens: 100_000, price_cents: 1990, label: "100K", msgs_estimate: 200 },
  { tokens: 500_000, price_cents: 7990, label: "500K", msgs_estimate: 1000 },
  { tokens: 1_000_000, price_cents: 13990, label: "1M", msgs_estimate: 2000 },
] as const;

export type TokenPackage = (typeof TOKEN_PACKAGES)[number];
