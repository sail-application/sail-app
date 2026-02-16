/**
 * app/error.tsx — Route-level error boundary for SAIL.
 *
 * Catches errors in page components and server components. Reports the error
 * to Sentry with a 'route-error' tag. Unlike global-error.tsx, this boundary
 * renders inside the root layout so the app shell (nav, sidebar) stays intact.
 */

"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { boundary: "route-error" },
    });
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <div className="max-w-md text-center rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <h2 className="mb-2 text-xl font-semibold text-slate-100">
          Something went wrong
        </h2>
        <p className="mb-6 text-sm text-slate-400">
          An unexpected error occurred. Our team has been notified.
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-blue-500/80 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
