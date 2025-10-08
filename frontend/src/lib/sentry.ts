import { flags } from "./flags.js";

// Placeholder for Sentry integration
// This would be implemented when SENTRY_DSN is configured

export const initSentry = () => {
  if (!flags.sentry.enabled) {
    console.log("Sentry disabled or DSN not configured");
    return;
  }

  console.log("Sentry would be initialized with DSN:", flags.sentry.dsn);
  // Actual Sentry initialization would go here
  // Sentry.init({
  //   dsn: flags.sentry.dsn,
  //   environment: import.meta.env.MODE,
  //   tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
  // });
};

export const captureException = (
  error: Error,
  context?: Record<string, any>,
) => {
  if (!flags.sentry.enabled) {
    console.error("Error captured (Sentry disabled):", error, context);
    return;
  }

  // Sentry.captureException(error, { extra: context });
  console.error("Error captured:", error, context);
};

export const captureMessage = (
  message: string,
  level: "info" | "warning" | "error" = "info",
  context?: Record<string, any>,
) => {
  if (!flags.sentry.enabled) {
    if (level === "warning") {
      console.warn(message, context);
    } else {
      console[level](message, context);
    }
    return;
  }

  // Sentry.captureMessage(message, level, { extra: context });
  if (level === "warning") {
    console.warn(message, context);
  } else {
    console[level](message, context);
  }
};
