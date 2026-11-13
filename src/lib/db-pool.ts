// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Connection-pool size for the Prisma query engine.
 *
 * Prisma's default is `physical CPUs × 2 + 1`. Production is ONE container
 * with one vCPU, so every request in the school shared THREE connections, and
 * each query is a ~95 ms round trip to Neon. Measured on production on
 * 2026-11-13 (demo school): the dashboard answered in 3.3 s alone, 7 s with
 * three requests at once and 15 s with nine, while a one-query probe stayed at
 * 95 ms — the requests were waiting for a connection, not for the database.
 *
 * Neon's `-pooler` host (PgBouncer) is built to take many client connections,
 * so the fix is to ask for more of them. `DB_POOL_SIZE` overrides the number
 * without a code change; a URL that already carries `connection_limit` wins.
 * The caller passes the two overrides by name: this module is reachable from
 * client bundles through `db.ts`, where a bare `process.env` is not an object.
 */
export const DEFAULT_POOL_SIZE = 15
/** Seconds a query may wait for a free connection (Prisma's default is 10). */
export const DEFAULT_POOL_TIMEOUT_S = 20

function positiveInt(raw: string | undefined): number | null {
  if (!raw) return null
  const n = Number(raw.trim())
  return Number.isInteger(n) && n > 0 && n <= 200 ? n : null
}

/**
 * Returns the datasource URL with `connection_limit` and `pool_timeout` added
 * when they are absent. Anything that is not a Postgres URL (undefined at
 * build time, a test stub) is returned unchanged, so this never throws.
 */
export function withPoolParams(
  url: string | undefined,
  env: { DB_POOL_SIZE?: string; DB_POOL_TIMEOUT?: string } = {}
): string | undefined {
  if (!url || !/^postgres(ql)?:\/\//i.test(url)) return url

  const hashAt = url.indexOf("#")
  const base = hashAt === -1 ? url : url.slice(0, hashAt)
  const hash = hashAt === -1 ? "" : url.slice(hashAt)
  const queryAt = base.indexOf("?")
  const head = queryAt === -1 ? base : base.slice(0, queryAt)
  // Split by hand: URLSearchParams would re-encode the rest of the query, and
  // this string carries a password that must reach Prisma byte for byte.
  const pairs = (queryAt === -1 ? "" : base.slice(queryAt + 1))
    .split("&")
    .filter(Boolean)
  const has = (key: string) => pairs.some((p) => p.split("=")[0] === key)

  if (!has("connection_limit")) {
    const size = positiveInt(env.DB_POOL_SIZE) ?? DEFAULT_POOL_SIZE
    pairs.push(`connection_limit=${size}`)
  }
  if (!has("pool_timeout")) {
    const wait = positiveInt(env.DB_POOL_TIMEOUT) ?? DEFAULT_POOL_TIMEOUT_S
    pairs.push(`pool_timeout=${wait}`)
  }
  return `${head}?${pairs.join("&")}${hash}`
}
