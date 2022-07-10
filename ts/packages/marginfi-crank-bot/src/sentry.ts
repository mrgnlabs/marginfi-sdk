export const Sentry = require("@sentry/node");
// or use es6 import statements
// import * as Sentry from '@sentry/node';

// @ts-ignore
const Tracing = require("@sentry/tracing");
// or use es6 import statements
// import * as Tracing from '@sentry/tracing';

const SENTRY_ACTIVE: boolean = !!process.env.SENTRY_DSN;

if (SENTRY_ACTIVE) {
  console.log("Starting Sentry");
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  });

  const transaction = Sentry.startTransaction({
    op: "test",
    name: "Test Transaction",
  });

  setTimeout(() => {
    try {
      //@ts-ignore
      foo();
    } catch (e) {
      Sentry.captureException(e);
    } finally {
      transaction.finish();
    }
  }, 99);

  process.on("unhandledRejection", (e: Error, promise: any) => {
    Sentry.captureException(e, {
      tags: {
        name: e.name,
        message: e.message,
        promise,
      },
    });
  });

  process.on("uncaughtException", (e: Error, origin: any) => {
    Sentry.captureException(e, {
      tags: {
        name: e.name,
        message: e.message,
        origin,
      },
    });
  });
}

export function captureException(e: any) {
  if (SENTRY_ACTIVE) {
    Sentry.captureException(e);
  }
}
