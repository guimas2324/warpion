export const colors = {
  bg: {
    primary: "#09090b",
    secondary: "#18181b",
    tertiary: "#27272a",
    elevated: "#0f0f12",
  },
  text: {
    primary: "#fafafa",
    secondary: "#a1a1aa",
    tertiary: "#71717a",
    muted: "#52525b",
  },
  brand: {
    primary: "#6366f1",
    hover: "#818cf8",
    muted: "#4f46e5",
    glow: "rgba(99, 102, 241, 0.15)",
    gradient: "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)",
  },
  border: {
    primary: "#27272a",
    secondary: "#3f3f46",
    subtle: "#1f1f23",
  },
  status: {
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
  },
  provider: {
    openai: "#10a37f",
    anthropic: "#d97706",
    google: "#4285f4",
    deepseek: "#06b6d4",
    xai: "#ef4444",
    elevenlabs: "#8b5cf6",
  },
} as const;

export const spacing = {
  page: "max-w-[900px] mx-auto",
  sidebar: "w-[280px]",
  headerHeight: "h-14",
} as const;
