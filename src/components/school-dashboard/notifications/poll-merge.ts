// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { NotificationDTO } from "./types"

export interface PollMergeResult {
  /** The next list to render. Same reference as `prev` when nothing changed. */
  merged: NotificationDTO[]
  /** Incoming items not previously held — the toast candidates. */
  fresh: NotificationDTO[]
  changed: boolean
}

/**
 * Merge a polled server snapshot into the in-memory notification list.
 *
 * Read-state sync is FORWARD-ONLY: a server `read: true` overwrites a local
 * unread item (covers "read it in another tab, bell still shows unread"), but
 * a server `read: false` never downgrades a local optimistic read — the
 * server may not have committed that mark yet, and `unreadCount` (always
 * taken verbatim from the server) reconciles the badge on its own.
 */
export function mergePolledNotifications(
  prev: NotificationDTO[],
  incoming: NotificationDTO[],
  max = 10
): PollMergeResult {
  const incomingById = new Map(incoming.map((n) => [n.id, n]))

  let readSynced = false
  const updated = prev.map((n) => {
    const server = incomingById.get(n.id)
    if (server?.read && !n.read) {
      readSynced = true
      return { ...n, read: true, readAt: server.readAt }
    }
    return n
  })

  const prevIds = new Set(prev.map((n) => n.id))
  const fresh = incoming.filter((n) => !prevIds.has(n.id))

  if (fresh.length === 0 && !readSynced) {
    return { merged: prev, fresh: [], changed: false }
  }
  return {
    merged: [...fresh, ...updated].slice(0, max),
    fresh,
    changed: true,
  }
}
