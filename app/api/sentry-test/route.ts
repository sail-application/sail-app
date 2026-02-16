/**
 * app/api/sentry-test/route.ts — Sentry verification endpoint.
 *
 * GET /api/sentry-test  → Returns Sentry init status
 * POST /api/sentry-test → Throws a test error that should appear in Sentry dashboard
 *
 * Remove this file once Sentry is confirmed working.
 */

import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

export async function GET() {
  const client = Sentry.getClient();

  return NextResponse.json({
    initialized: !!client,
    dsn: client?.getDsn()?.toString() ?? "not set",
    transport: client?.getTransport() ? "active" : "none",
    environment:
      (client?.getOptions() as { environment?: string })?.environment ??
      "unknown",
  });
}

export async function POST() {
  // Deliberately capture a test exception to verify Sentry is receiving events
  const testError = new Error("SAIL Sentry Test — this error is intentional");
  const eventId = Sentry.captureException(testError);

  // Flush to make sure the event is sent before the response
  await Sentry.flush(5000);

  return NextResponse.json({
    success: true,
    eventId,
    message:
      "Test error sent to Sentry. Check your dashboard in 1-2 minutes.",
  });
}
