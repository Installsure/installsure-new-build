// Feature flags based on environment variables
export const flags = {
  sentry: {
    enabled: !!(import.meta as any).env?.VITE_SENTRY_DSN,
    dsn: (import.meta as any).env?.VITE_SENTRY_DSN || "",
  },
  quickbooks: {
    enabled: (import.meta as any).env?.VITE_QB_ENABLED === "true",
  },
  forge: {
    enabled: (import.meta as any).env?.VITE_FORGE_ENABLED !== "false", // Default enabled
  },
  debug: {
    enabled: (import.meta as any).env?.VITE_DEBUG === "true",
  },
} as const;

export type FeatureFlags = typeof flags;
