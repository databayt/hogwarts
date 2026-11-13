// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The page address a report may carry: origin and path, nothing else.
 *
 * The report dialog is mounted on every page, including the ones reached from
 * an emailed link (`/new-password?token=…`, `/new-verification?token=…`), and
 * the pipeline prints the address into the issue it files. The query string is
 * where one-time tokens, search terms and filters live, and the fragment can
 * hold the same, so both are dropped before the address leaves the browser and
 * again on the server (an old client, the mobile app, a hand-made request).
 * Credentials in the authority part (`user:pass@host`) go too.
 *
 * Hogwarts-only on purpose: `pipeline.ts` is the copy shared with kun, so the
 * address is cleaned before the pipeline is called, not inside it.
 */
export function sanitizePageUrl(raw: string): string {
  const input = (raw ?? "").trim()
  if (!input) return ""
  let url: URL
  try {
    url = new URL(input)
  } catch {
    // Not a URL: hand it on and let the schema reject it.
    return input
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return input
  return `${url.protocol}//${url.host}${url.pathname}`
}
