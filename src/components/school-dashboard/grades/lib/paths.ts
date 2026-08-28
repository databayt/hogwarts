// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Paths used by `revalidatePath` after a grades mutation.
 *
 * `revalidatePath` references the internal file-system route, so the
 * `/s/[subdomain]` segment stays in (route GROUPS like `(listings)` do not —
 * they never reach the URL). The dynamic segments must remain bracketed and
 * the `"page"` type argument is mandatory: Next ignores a bracketed path
 * without it, and a BLENDED path (a real subdomain inside an otherwise
 * bracketed route) matches no cache tag at all. Every call site is therefore
 * `revalidatePath(gradesPath(...), "page")`.
 *
 * The bare `"/grades/reports"`-style strings this replaced matched nothing —
 * every grades revalidation had been a silent no-op.
 */
export function gradesPath(subPath = ""): string {
  const sub = subPath ? `/${subPath.replace(/^\//, "")}` : ""
  return `/[lang]/s/[subdomain]/grades${sub}`
}

/** Guardian-facing child pages (`/parent/children/[id]/...`). */
export function parentPath(subPath = ""): string {
  const sub = subPath ? `/${subPath.replace(/^\//, "")}` : ""
  return `/[lang]/s/[subdomain]/parent${sub}`
}
