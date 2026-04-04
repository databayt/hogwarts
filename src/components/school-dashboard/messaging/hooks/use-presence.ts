"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useRef, useState } from "react"

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
 */
export function useUserPresence(userId: string | undefined) {
  const { getPresence } = usePresence(userId ? [userId] : [])
  return userId ? getPresence(userId) : ({ state: "unknown" } as const)
}
