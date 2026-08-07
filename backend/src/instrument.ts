import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: "https://cf193055468769489d4a988151f92832@o4511868506996736.ingest.de.sentry.io/4511868515254352",

  integrations: [
    nodeProfilingIntegration(),
  ],

  // Send structured logs to Sentry
  enableLogs: true,

  // Tracing
  tracesSampleRate: 1.0,

  // Profiling
  profileSessionSampleRate: 1.0,
  profileLifecycle: "trace",

  environment: process.env.NODE_ENV || "development",
  enabled: process.env.NODE_ENV === "production",
});
