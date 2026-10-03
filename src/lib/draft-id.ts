// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Ids the browser mints for a wizard draft (`mintDraftId` in
 * `components/form/wizard/draft-store.ts`): "c" + 24 base-36 characters, the
 * shape of every `@default(cuid())` row. A create action that accepts one
 * checks it here; the tenant still comes from the session, and a collision
 * just fails the primary key.
 */
export function isDraftId(id: unknown): id is string {
  return typeof id === "string" && /^c[0-9a-z]{24}$/.test(id)
}
