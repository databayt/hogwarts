// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { getActiveTerm, getPersonalizedTimetable } from "./actions"
import type { InitialTimetable } from "./views/role-router"

/**
 * The two reads the grid waits on, started by the page instead of from the
 * client's mount effect. The page passes the promise down un-awaited: the
 * skeleton streams at once and `RoleRouter` reads it under Suspense, so the
 * data arrives in the same response rather than behind two more phone ↔
 * server round trips. Any failure resolves to null and the router loads them
 * itself, errors and all.
 *
 * A plain server module, not `actions.ts`: every export there is a public
 * HTTP endpoint.
 */
export async function loadInitialTimetable(): Promise<InitialTimetable | null> {
  try {
    const { term } = await getActiveTerm()
    if (!term) return null
    const data = await getPersonalizedTimetable({ termId: term.id })
    return { termId: term.id, data }
  } catch {
    return null
  }
}
