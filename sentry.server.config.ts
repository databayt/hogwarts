import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Additional server-specific options
    beforeSend(event) {
      // Remove sensitive data
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
      }

      // Add school context if available
      if (event.extra?.schoolId) {
        event.contexts = {
          ...event.contexts,
          school: {
            id: event.extra.schoolId,
          },
        };
      }

      return event;
    },

    // Profiling (requires additional setup)
    profilesSampleRate: 0.1,
  });
}