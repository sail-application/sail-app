/**
 * app/api/health/route.ts
 *
 * Health check endpoint for uptime monitoring and load balancer probes.
 * Returns a simple JSON payload with status, timestamp, and app version.
 * No authentication required — this must be publicly accessible.
 */

import { NextResponse } from 'next/server';

/** Current application version — update on each release */
const APP_VERSION = '2.0.0';

/**
 * GET /api/health
 * Returns a JSON object confirming the service is running.
 * Used by Vercel, Docker health checks, and external monitors.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
  });
}
