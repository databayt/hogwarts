// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Opt-in query tracing for the performance lab. PERF_TRACE=1 turns it on;
 * without it nothing here runs and src/lib/db.ts installs no extension.
 *
 * One JSON line per query goes to stdout:
 *
 *   {"perf":"db","q":"Student.findMany","t":1789…,"ms":3.1,"req":"k3f9x2","sig":"9c1e07aa"}
 *
 *   PERF_TRACE=1 pnpm dev > /tmp/hogwarts-trace.log     # then: pnpm perf:queries
 *
 * `req` groups the queries of one server render — React's `cache()` is scoped
 * to the request being rendered, so its first call mints the id and every
 * later call in that render gets the same one. Outside a render (route
 * handlers, cron) there is no such scope and each call gets its own id.
 *
 * `sig` is a hash of the query's arguments, so the audit can spot the same
 * query issued twice in one render WITHOUT the arguments — ids, names, emails —
 * ever being written anywhere. Nothing but model, operation, timing and that
 * hash leaves this file.
 *
 * No Node built-ins on purpose: src/lib/db.ts is still reachable from a few
 * client bundles (see the `@prisma/adapter-pg` browser alias in
 * next.config.ts), and an `fs` import there fails the build.
 */
import { cache } from "react"

export const TRACE_QUERIES = process.env.PERF_TRACE === "1"

const requestId = cache((): string => Math.random().toString(36).slice(2, 8))

/** FNV-1a, 32-bit — a fingerprint, not a secret. */
function signature(args: unknown): string {
  let text: string
  try {
    text = JSON.stringify(args ?? null)
  } catch {
    return "?"
  }
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, "0")
}

export async function traceQuery<T>(
  model: string | undefined,
  operation: string,
  args: unknown,
  run: () => Promise<T>
): Promise<T> {
  let req = "-"
  try {
    req = requestId()
  } catch {
    // Not inside a render.
  }
  const startedAt = Date.now()
  const started = performance.now()
  try {
    return await run()
  } finally {
    const line = JSON.stringify({
      perf: "db",
      q: `${model ?? "$raw"}.${operation}`,
      t: startedAt,
      ms: Math.round((performance.now() - started) * 10) / 10,
      req,
      sig: signature(args),
    })
    // Not console.log: next.config's `removeConsole` strips it in production.
    if (typeof process !== "undefined" && process.stdout?.write)
      process.stdout.write(line + "\n")
  }
}
