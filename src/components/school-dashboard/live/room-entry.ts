// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * May this reader be handed the way INTO a class — the in-app room, or an
 * external session's meeting URL?
 *
 * Seeing a session (its detail page) and entering it are different questions,
 * and the external path used to answer only the first. `canAccessSession`
 * lets STAFF see every section's sessions and a guardian see their child's
 * whatever the school's observe switch says — right for reading, wrong for
 * entering. For an in-app room join-core refuses those readers at the ticket,
 * so the leak was the EXTERNAL session: the room page redirected straight to
 * its meeting URL and the detail page printed it, handing a Zoom link to an
 * office account or to a guardian the school had chosen not to let watch.
 *
 * Mirrors join-core's matrix: teaching roles and enrolled students enter;
 * a guardian only where the school lets guardians observe; staff and
 * accountants only a school-wide session. Enrollment itself is checked
 * upstream (`readLiveClass` / `getLiveClass`) — this only narrows by role.
 */
export function mayEnterRoom(opts: {
  role: string | null | undefined
  visibility: "section" | "school" | string | null | undefined
  guardiansObserve: boolean
}): boolean {
  switch (opts.role) {
    case "DEVELOPER":
    case "ADMIN":
    case "TEACHER":
    case "STUDENT":
      return true
    case "GUARDIAN":
      return opts.guardiansObserve
    case "STAFF":
    case "ACCOUNTANT":
      return opts.visibility === "school"
    default:
      return false
  }
}
