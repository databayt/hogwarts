"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import socketService from "@/lib/websocket/socket-service"

export type PresenceStatus =
  | { state: "online" }
  | { state: "offline"; lastSeenAt: Date }
  | { state: "unknown" }

/**
 * Track online presence for a set of user IDs.
 * Listens to Socket.IO presence:online / presence:offline events.
 */
export function usePresence(userIds: string[]) {
  const [presenceMap, setPresenceMap] = useState<Map<string, PresenceStatus>>(
    new Map()
  )

  useEffect(() => {
    if (userIds.length === 0) return

    const unsubOnline = socketService.on("presence:online", (data) => {
      if (userIds.includes(data.userId)) {
        setPresenceMap((prev) => {
          const next = new Map(prev)
          next.set(data.userId, { state: "online" })
          return next
        })
      }
    })

    const unsubOffline = socketService.on("presence:offline", (data) => {
      if (userIds.includes(data.userId)) {
        setPresenceMap((prev) => {
          const next = new Map(prev)
          next.set(data.userId, {
            state: "offline",
            lastSeenAt: new Date(data.lastSeenAt),
          })
          return next
        })
      }
    })

    return () => {
      unsubOnline()
      unsubOffline()
    }
  }, [userIds.join(",")])

  const getPresence = useCallback(
    (userId: string): PresenceStatus => {
      return presenceMap.get(userId) || { state: "unknown" }
    },
    [presenceMap]
  )

  return { presenceMap, getPresence }
}

/**
 * Get a single user's presence status — convenience wrapper.
 * Returns a stable memoized object so consumers only re-render when this
 * specific user's status actually changes, not on any presence map update.
 */
export function useUserPresence(userId: string | undefined) {
  const { getPresence } = usePresence(userId ? [userId] : [])
  const rawStatus = userId
    ? getPresence(userId)
    : ({ state: "unknown" } as const)
  // Memoize by the relevant scalar fields to give consumers a stable reference
  // when nothing about this user's status has changed.
  return useMemo(
    () => rawStatus,
    // PresenceStatus is a discriminated union — compare state + lastSeenAt
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      rawStatus.state,
      (rawStatus as { state: "offline"; lastSeenAt: Date }).lastSeenAt,
    ]
  )
}
