import * as Sentry from '@sentry/react';

let initialized = false;

// Free Sentry account + DSN gets you real visibility into what breaks for
// real users, instead of finding out only when someone complains. Until
// VITE_SENTRY_DSN is set (Vercel -> Settings -> Environment Variables),
// this just quietly does nothing — errors still log to the console, same
// as before.
export function initErrorMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Conservative defaults — enough to catch real crashes without
    // burning through Sentry's free-tier event quota on noise.
    tracesSampleRate: 0.1,
  });
  initialized = true;
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  console.error(error);
  if (initialized) {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  }
}
