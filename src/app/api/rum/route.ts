// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Real-user metrics beacon — the fallback.
 *
 * In production the Cloudflare Worker answers POST /api/rum before the request
 * can reach this container (cf/worker.js → Analytics Engine), so this handler
 * only ever runs where there is no Worker in front: `next dev`, `next start`,
 * the deploy smoke run. It accepts and drops the beacon so the page's
 * `sendBeacon` does not log a 404. Set PERF_RUM_DEBUG=1 to print what the page
 * sent while working on src/components/monitoring/web-vitals.tsx.
 */
export async function POST(request: Request): Promise<Response> {
  if (process.env.PERF_RUM_DEBUG === "1") {
    const body = await request.text().catch(() => "")
    console.warn("[rum]", body.slice(0, 2000))
  }
  return new Response(null, { status: 204 })
}
