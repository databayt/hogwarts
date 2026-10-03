// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Drafts the browser has opened but the server may not have written yet.
 *
 * "+" on a listing used to await the draft INSERT, then navigate, then load
 * the row it had just created — three round trips before the first field
 * could be typed in. Now the table mints the id here, fires the create
 * without awaiting it, and registers a seed (the empty row the load would
 * have returned). The wizard opens on the seed in the same frame, and its
 * save queue (`wizard-runtime.tsx`) holds every save behind `created`, so no
 * update can reach a row that does not exist yet.
 *
 * Module state is per browser tab, which is exactly the lifetime wanted: a
 * hard refresh drops the seed and the wizard loads the row from the server.
 */

export interface DraftResult {
  success: boolean
  error?: string
}

interface PendingDraft {
  created: Promise<DraftResult>
  seed: unknown
}

const pending = new Map<string, PendingDraft>()

/**
 * A cuid-shaped id ("c" + 24 base-36 chars) — the shape Prisma's
 * `@default(cuid())` gives every other row, and what `z.string().cuid()` and
 * the server's `isDraftId` accept.
 */
export function mintDraftId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  let id = "c"
  for (const byte of bytes) id += (byte % 36).toString(36)
  return id
}

/** Start creating a draft in the background and remember its seed. */
export function startDraft<T>(
  id: string,
  create: () => Promise<DraftResult>,
  seed: T
): void {
  const created = create().catch(
    (): DraftResult => ({ success: false, error: "CREATE_FAILED" })
  )
  pending.set(id, { created, seed })
}

/** The pending draft for `id`, if this tab started one. Never mutates. */
export function peekDraft<T>(
  id: string | null | undefined
): { created: Promise<DraftResult>; seed: T } | undefined {
  if (!id) return undefined
  return pending.get(id) as
    | { created: Promise<DraftResult>; seed: T }
    | undefined
}

/** Drop the seed once the wizard has taken it (re-entry loads from the server). */
export function forgetDraft(id: string): void {
  pending.delete(id)
}
