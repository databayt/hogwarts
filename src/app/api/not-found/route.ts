// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Plain 404 for a missing top-level file (`/icon-attendance.png`).
 *
 * `next.config.ts` rewrites dotted single-segment paths here after the
 * filesystem check, so files in public/ and static routes like
 * `/manifest.webmanifest` are served first. Without it the request fell
 * through to `app/[lang]` as an unknown locale, rendered in static mode, hit
 * `headers()` in the root layout and answered 500 — which reads as an outage
 * in the logs and hides why the service worker's `cache.addAll` rejected.
 */
function notFound() {
  return new Response("Not Found", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}

export const GET = notFound
export const HEAD = notFound
