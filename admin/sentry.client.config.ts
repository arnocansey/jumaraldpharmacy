import { readFileSync } from "fs";
import path from "path";

export function getSentryConfig() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return null;

  return {
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV || "development",
    enabled: process.env.NODE_ENV === "production",
  };
}
