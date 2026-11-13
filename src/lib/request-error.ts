// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * One log line for a server error, as plain data.
 *
 * Until 2026-11-13 a failed render, route handler or server action left no
 * trace in production: the error boundaries swallowed it and nothing reported
 * it, so the first sign of a broken page was a school telling us. Next calls
 * `onRequestError` (src/instrumentation.ts) for every such error; this turns
 * what it hands over into one flat JSON object that Workers Logs can filter on
 * (`event = "request_error"`, `school`, `routePath`, `digest`).
 *
 * What is deliberately left out: cookies and every header but the host, the
 * request body, and the query string — it can carry a one-time token.
 */
export type RequestErrorLine = {
  level: "error"
  event: "request_error"
  at: string
  message: string
  name?: string
  /** The code the error page shows the reader; ties a report to this line. */
  digest?: string
  method: string
  /** Path only, never the query string. */
  path: string
  host?: string
  /** The tenant subdomain, when the host has one (`alabidae.balqalam.com`). */
  school?: string
  routePath?: string
  routeType?: string
  routerKind?: string
  renderSource?: string
  stack?: string
}

/** Control flow that Next raises on purpose; never an incident. */
const NOT_AN_ERROR = [
  "NEXT_REDIRECT",
  "NEXT_NOT_FOUND",
  "NEXT_HTTP_ERROR_FALLBACK",
  "DYNAMIC_SERVER_USAGE",
  "BAILOUT_TO_CLIENT_SIDE_RENDERING",
]

const MAX_MESSAGE = 500
const MAX_STACK = 1200

function headerValue(
  headers: Record<string, string | string[] | undefined> | undefined,
  name: string
): string | undefined {
  const raw = headers?.[name]
  const value = Array.isArray(raw) ? raw[0] : raw
  return typeof value === "string" && value ? value : undefined
}

function schoolOf(host: string | undefined): string | undefined {
  if (!host) return undefined
  const name = host.split(":")[0]!.toLowerCase()
  const labels = name.split(".")
  // `alabidae.balqalam.com`, `demo.localhost` — not the apex, not `www`.
  if (labels.length < 2) return undefined
  if (labels.length === 2 && labels[1] !== "localhost") return undefined
  const first = labels[0]!
  return first && first !== "www" ? first : undefined
}

export function isControlFlow(error: unknown): boolean {
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String((error as { digest?: unknown }).digest ?? "")
      : ""
  return NOT_AN_ERROR.some((code) => digest.startsWith(code))
}

export function describeRequestError(
  error: unknown,
  request: {
    path?: string
    method?: string
    headers?: Record<string, string | string[] | undefined>
  },
  context: {
    routerKind?: string
    routePath?: string
    routeType?: string
    renderSource?: string
  },
  now: Date = new Date()
): RequestErrorLine {
  const isError = error instanceof Error
  const message = (isError ? error.message : String(error)).slice(
    0,
    MAX_MESSAGE
  )
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String((error as { digest?: unknown }).digest ?? "") || undefined
      : undefined
  const host =
    headerValue(request.headers, "x-forwarded-host") ??
    headerValue(request.headers, "host")
  const rawPath = request.path ?? ""
  const path = rawPath.split("?")[0]!.split("#")[0]!

  return {
    level: "error",
    event: "request_error",
    at: now.toISOString(),
    message,
    name: isError ? error.name : undefined,
    digest,
    method: request.method ?? "",
    path,
    host,
    school: schoolOf(host),
    routePath: context.routePath,
    routeType: context.routeType,
    routerKind: context.routerKind,
    renderSource: context.renderSource,
    stack: isError && error.stack ? error.stack.slice(0, MAX_STACK) : undefined,
  }
}
