// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { refresh, revalidatePath } from "next/cache"

/**
 * After a mutation, show the change on the page the user is looking at.
 *
 * Mutations used to call `revalidatePath("/students")`-style literal paths.
 * Those name the URL, not the file-system route (`/[lang]/s/[subdomain]/…`),
 * so they matched no cache entry and invalidated nothing. What they did do,
 * inside a Server Action, was:
 *   1. re-render the current page into the action response — the part the
 *      UI actually relied on; and
 *   2. flag the response "static and dynamic data changed", which makes the
 *      client throw away its whole prefetch cache — so every visible link
 *      re-prefetched after every save, all of it landing on one ½-vCPU
 *      container just as the user reached for the next tap.
 *
 * `refresh()` keeps (1) and drops (2): the page re-renders, the client still
 * evicts the dynamic data of previously visited pages, and the prefetched
 * loading shells stay. It exists only inside a Server Action, so anywhere
 * else — a route handler, a cron, an `after()` tail — this falls back to the
 * exact call it replaced.
 */
export function refreshPage(path: string): void {
  try {
    refresh()
  } catch {
    revalidatePath(path)
  }
}
