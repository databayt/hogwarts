import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session tracking
    autoSessionTracking: true,

    // Capture replay for error sessions
    integrations: [
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
        maskTextContent: true,
      }),
    ],

    // Session replay sampling
    replaysSessionSampleRate: 0.1, // 10% of sessions will have replay
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors will have replay

    // Filter out sensitive information
    beforeSend(event, hint) {
      // Remove sensitive data from error messages
      if (event.request?.cookies) {
        delete event.request.cookies;
      }

      // Filter out specific errors
      const error = hint.originalException;
      if (error && typeof error === 'object' && 'message' in error) {
        // Don't send network errors in development
        if (process.env.NODE_ENV !== 'production' &&
            String(error.message).includes('NetworkError')) {
          return null;
        }
      }

      return event;
    },
  });
}