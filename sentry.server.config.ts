// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
	dsn: "https://3eb384b2fab8abe80a6f71411b3b7072@o4510331200602121.ingest.de.sentry.io/4510331223146576",

	integrations: [
		// Add the Vercel AI SDK integration to sentry.server.config.ts
		Sentry.vercelAIIntegration({
			recordInputs: true,
			recordOutputs: true,
		}),
		Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
	],

	// Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
	tracesSampleRate: 1,

	// Enable logs to be sent to Sentry
	enableLogs: true,

	// Enable sending user PII (Personally Identifiable Information)
	// https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
	sendDefaultPii: true,
});
