import { env } from "../config/env";

const configuredOrigins = env.ALLOWED_ORIGINS
  ? env.ALLOWED_ORIGINS.split(",").map((o) => o.trim().replace(/\/$/, ""))
  : [];

const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:5000",
  "https://jumaraldpharmacy.com",
  "https://www.jumaraldpharmacy.com",
];

export function isOriginAllowed(origin: string | undefined): boolean {
  // Allow non-browser requests (mobile apps, Postman, server-to-server, curl)
  if (!origin) return true;

  const cleanOrigin = origin.replace(/\/$/, "");

  // If wildcard * is present in ALLOWED_ORIGINS, allow all origins
  if (configuredOrigins.includes("*")) {
    return true;
  }

  // Exact match against configured ALLOWED_ORIGINS
  if (configuredOrigins.includes(cleanOrigin)) {
    return true;
  }

  // Exact match against default local & production domain origins
  if (defaultAllowedOrigins.includes(cleanOrigin)) {
    return true;
  }

  // Match Jumarald specific Vercel preview/production deployments and custom domains
  if (
    /^https:\/\/(www\.)?jumarald.*\.vercel\.app$/.test(cleanOrigin) ||
    /^https:\/\/jumarald.*\.onrender\.com$/.test(cleanOrigin) ||
    /\.jumaraldpharmacy\.com$/.test(cleanOrigin)
  ) {
    return true;
  }

  return false;
}
