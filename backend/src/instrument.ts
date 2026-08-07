import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

const dsn = process.env.SENTRY_DSN || "https://cf193055468769489d4a988151f92832@o4511868506996736.ingest.de.sentry.io/4511868515254352";

Sentry.init({
  dsn,

  integrations: [
    nodeProfilingIntegration(),
  ],

  enableLogs: true,

  tracesSampleRate: 1.0,

  profileSessionSampleRate: 1.0,
  profileLifecycle: "trace",

  environment: process.env.NODE_ENV || "development",
});
