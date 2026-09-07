// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Browser stand-in for `@prisma/adapter-pg` (wired in next.config.ts
 * `turbopack.resolveAlias`). `src/lib/db.ts` imports the adapter for the
 * Cloudflare Workers lane, and db.ts is reachable from client bundles through
 * modules that never call it at runtime (the same way `@prisma/client`
 * resolves to its own browser stub). The real adapter drags `pg` and its
 * dns/net/tls requires into the client graph, which cannot resolve.
 */
export class PrismaPg {
  constructor(..._args: unknown[]) {
    throw new Error("@prisma/adapter-pg is server-only")
  }
}
