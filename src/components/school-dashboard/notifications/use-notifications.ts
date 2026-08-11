"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useState } from "react"
import type { NotificationPriority, NotificationType } from "@prisma/client"
import { useSession } from "next-auth/react"

import socketService from "@/lib/websocket/socket-service"
import { toast } from "@/components/ui/use-toast"
import { detectScript } from "@/components/translation/util"

import { markAllNotificationsAsRead, markNotificationAsRead } from "./actions"
import type { NotificationBellData } from "./poll-actions"
import { mergePolledNotifications } from "./poll-merge"
import type { NotificationDTO } from "./types"

interface UseNotificationsOptions {
  autoConnect?: boolean
  autoSubscribe?: boolean
  showToast?: boolean
  pollInterval?: number // Polling interval in ms (default: 30000)
  locale?: "ar" | "en" // Display locale for translating notification content
  onNewNotification?: (notification: NotificationDTO) => void
  onNotificationRead?: (notificationId: string) => void
  onNotificationDeleted?: (notificationId: string) => void
}

interface UseNotificationsReturn {
  isConnected: boolean
  unreadCount: number
  recentNotifications: NotificationDTO[]
  connect: () => Promise<void>
  disconnect: () => void
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  removeNotification: (notificationId: string) => void
  clearRecent: () => void
}

const DEFAULT_POLL_INTERVAL = 30000

// ---------------------------------------------------------------------------
// Shared bell fetch — module scope so every hook instance in the tab (header
// bell, mobile bell, notification center) collapses into ONE server action
// call per window instead of issuing parallel identical polls.
// ---------------------------------------------------------------------------
const POLL_SHARE_WINDOW_MS = 5000

let inflightPoll: Promise<NotificationBellData | null> | null = null
let inflightLocale: string | undefined
let lastPollAt = 0
let lastPollLocale: string | undefined
let lastPollData: NotificationBellData | null = null

// GET route, NOT the server action: auth() rotates the session cookie inside
// action requests, so every action response ships a full RSC re-render of the
// current page — ~1MB per poll instead of ~2KB of JSON.
async function requestBellData(
  locale?: "ar" | "en"
): Promise<NotificationBellData | null> {
  const search = locale ? `?locale=${locale}` : ""
  const res = await fetch(`/api/notifications/bell${search}`, {
    cache: "no-store",
  })
  if (!res.ok) return null
  return (await res.json()) as NotificationBellData
}

async function fetchBellDataShared(
  locale?: "ar" | "en"
): Promise<NotificationBellData | null> {
  if (
    lastPollData &&
    lastPollLocale === locale &&
    Date.now() - lastPollAt < POLL_SHARE_WINDOW_MS
  ) {
    return lastPollData
  }
  if (inflightPoll && inflightLocale === locale) {
    return inflightPoll
  }
  inflightLocale = locale
  inflightPoll = requestBellData(locale)
    .then((data) => {
      // Never cache null — an auth/tenant hiccup shouldn't blank the next
      // subscriber's poll.
      if (data) {
        lastPollData = data
        lastPollLocale = locale
        lastPollAt = Date.now()
      }
      return data
    })
    .finally(() => {
      inflightPoll = null
    })
  return inflightPoll
}

/**
 * useNotifications Hook - Real-Time Notifications via WebSocket
 *
 * Manages real-time notifications using Socket.IO:
 * - Auto-connect/disconnect on mount/unmount
 * - Dual-channel persistence (Socket.IO + server action)
 * - Optimistic updates with rollback on failure
 * - Toast notifications for new messages
 * - Real-time unread count tracking
 *
 * KEY PATTERNS:
 * - DUAL PERSISTENCE: Updates via Socket.IO AND server action for reliability
 * - OPTIMISTIC UPDATES: UI updates immediately, reverts if server call fails
 * - MULTI-EVENT LISTENERS: Subscribes to new/read/deleted/count events
 * - INITIAL FETCH ALWAYS RUNS: sockets only push NEW events, so the first
 *   paint comes from one poll regardless of transport
 * - VISIBILITY-AWARE POLLING: hidden tabs skip polls; returning to the tab
 *   catches up immediately when the data is stale
 *
 * GOTCHAS:
 * - `isConnected` truth comes from socketService.isConnected(), NEVER from
 *   connect() resolving — in production (no NEXT_PUBLIC_SOCKET_URL) connect()
 *   resolves without a socket, and trusting it disables the polling fallback
 * - Toast disabled by default in NotificationBell (UI has own display)
 * - Old notifications (>10 recent) are not kept in memory (server has full history)
 */
export function useNotifications(
  options: UseNotificationsOptions = {}
): UseNotificationsReturn {
  const { data: session } = useSession()
  const [isConnected, setIsConnected] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [recentNotifications, setRecentNotifications] = useState<
    NotificationDTO[]
  >([])

  // Primitives, not the session object: useSession() returns a fresh object
  // on every focus refetch, and depending on it tears down/re-creates the
  // socket connection and poll timers on every window focus.
  const userId = session?.user?.id
  const schoolId = session?.user?.schoolId
  const role = session?.user?.role

  const connect = useCallback(async () => {
    if (!userId) {
      console.warn("No session available for WebSocket connection")
      return
    }

    try {
      await socketService.connect(schoolId || "", userId, role ?? "")
      // connect() resolving does NOT imply a live socket (the no-server
      // short-circuit resolves with none) — read the truth from the socket.
      const connected = socketService.isConnected()
      setIsConnected(connected)

      // Subscribe to notifications if enabled
      if (connected && options.autoSubscribe !== false) {
        socketService.subscribeToNotifications(userId)
      }
    } catch (error) {
      console.error("Failed to connect WebSocket:", error)
      setIsConnected(false)
    }
  }, [userId, schoolId, role, options.autoSubscribe])

  const disconnect = useCallback(() => {
    if (userId) {
      socketService.unsubscribeFromNotifications(userId)
    }
    socketService.disconnect()
    setIsConnected(false)
  }, [userId])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // Optimistic update - updates UI immediately for better UX
      setRecentNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, read: true, readAt: new Date().toISOString() }
            : n
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))

      // Send to server via Socket.IO for real-time propagation to other tabs
      socketService.markNotificationRead(notificationId)

      // Also call server action for persistence - reliability fallback if Socket.IO fails
      const result = await markNotificationAsRead({ notificationId })
      if (!result.success) {
        console.error("Failed to mark notification as read:", result.error)
        // Revert optimistic update if persistence fails
        setRecentNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, read: false, readAt: null } : n
          )
        )
        setUnreadCount((prev) => prev + 1)
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (!userId) return

    try {
      // Optimistic update
      setRecentNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read: true,
          readAt: new Date().toISOString(),
        }))
      )
      const previousCount = unreadCount
      setUnreadCount(0)

      // Send to server via Socket.IO
      socketService.markAllNotificationsRead(userId)

      // Also call server action for persistence
      const result = await markAllNotificationsAsRead({ userId })
      if (!result.success) {
        console.error("Failed to mark all notifications as read:", result.error)
        // Revert optimistic update
        setUnreadCount(previousCount)
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }, [userId, unreadCount])

  const removeNotification = useCallback((notificationId: string) => {
    setRecentNotifications((prev) =>
      prev.filter((n) => n.id !== notificationId)
    )
  }, [])

  const clearRecent = useCallback(() => {
    setRecentNotifications([])
  }, [])

  // Auto-connect if enabled
  useEffect(() => {
    if (options.autoConnect && userId) {
      connect()
    }

    return () => {
      if (options.autoConnect) {
        disconnect()
      }
    }
  }, [options.autoConnect, userId, connect, disconnect])

  // Initial fetch — runs regardless of transport. A live socket only pushes
  // NEW events, so without this the bell stays empty until something happens.
  useEffect(() => {
    if (!userId || !schoolId) return

    let active = true
    fetchBellDataShared(options.locale).then((data) => {
      if (!active || !data) return
      setUnreadCount(data.unreadCount)
      setRecentNotifications(
        (prev) => mergePolledNotifications(prev, data.recent).merged
      )
    })
    return () => {
      active = false
    }
  }, [userId, schoolId, options.locale])

  // Polling fallback when Socket.IO is unavailable
  useEffect(() => {
    if (isConnected || !userId || !schoolId) return

    const interval = options.pollInterval ?? DEFAULT_POLL_INTERVAL

    let active = true
    const poll = async () => {
      // Hidden tabs skip the round-trip entirely; the visibilitychange
      // handler below catches up the moment the tab is foregrounded.
      if (!active || document.visibilityState === "hidden") return
      try {
        const data = await fetchBellDataShared(options.locale)
        if (!active || !data) return
        setUnreadCount(data.unreadCount)
        if (data.recent.length > 0) {
          setRecentNotifications((prev) => {
            const { merged, fresh, changed } = mergePolledNotifications(
              prev,
              data.recent
            )
            if (!changed) return prev
            // Show toast for genuinely new notifications
            if (options.showToast !== false) {
              for (const n of fresh) {
                if (!n.read) {
                  toast({
                    title: n.title,
                    description: n.body,
                    variant:
                      n.priority === "urgent" ? "destructive" : "default",
                  })
                }
              }
            }
            return merged
          })
        }
      } catch {
        // Silently fail — next poll will retry
      }
    }

    // Initial fetch
    poll()
    const timer = setInterval(poll, interval)

    const onVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastPollAt > interval / 2
      ) {
        poll()
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      active = false
      clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [
    isConnected,
    userId,
    schoolId,
    options.pollInterval,
    options.showToast,
    options.locale,
  ])

  // Set up notification event listeners
  useEffect(() => {
    if (!isConnected) return

    const subscriptions: Array<() => void> = []

    // Listen for new notifications
    subscriptions.push(
      socketService.on("notification:new", (data) => {
        const notification: NotificationDTO = {
          id: data.id,
          schoolId: schoolId || "",
          userId: userId || "",
          type: data.type as NotificationType,
          priority: data.priority as NotificationPriority,
          title: data.title,
          body: data.body,
          // Socket payloads carry no lang — key off the actual script so the
          // row stays translatable (a mislabeled lang can never be localized)
          lang: detectScript(`${data.title} ${data.body}`),
          metadata: null,
          actorId: data.actorId || null,
          actor: null,
          read: false,
          readAt: null,
          channels: [],
          emailSent: false,
          emailSentAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        // Add to recent notifications
        setRecentNotifications((prev) => [notification, ...prev.slice(0, 9)])

        // Increment unread count
        setUnreadCount((prev) => prev + 1)

        // Show toast notification if enabled
        if (options.showToast !== false) {
          toast({
            title: notification.title,
            description: notification.body,
            variant:
              notification.priority === "urgent"
                ? "destructive"
                : ("default" as const),
          })
        }

        // Call custom callback
        options.onNewNotification?.(notification)
      })
    )

    // Listen for notification read events
    subscriptions.push(
      socketService.on("notification:read", (data) => {
        setRecentNotifications((prev) =>
          prev.map((n) =>
            n.id === data.notificationId
              ? { ...n, read: true, readAt: new Date().toISOString() }
              : n
          )
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
        options.onNotificationRead?.(data.notificationId)
      })
    )

    // Listen for notification deleted events
    subscriptions.push(
      socketService.on("notification:deleted", (data) => {
        setRecentNotifications((prev) =>
          prev.filter((n) => n.id !== data.notificationId)
        )
        options.onNotificationDeleted?.(data.notificationId)
      })
    )

    // Listen for unread count updates
    subscriptions.push(
      socketService.on("notification:count", (data) => {
        setUnreadCount(data.unread)
      })
    )

    // Cleanup
    return () => {
      subscriptions.forEach((unsubscribe) => unsubscribe())
    }
  }, [
    isConnected,
    userId,
    schoolId,
    options.showToast,
    options.onNewNotification,
    options.onNotificationRead,
    options.onNotificationDeleted,
  ])

  return {
    isConnected,
    unreadCount,
    recentNotifications,
    connect,
    disconnect,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearRecent,
  }
}

/**
 * Hook for notification bell component
 * Simplified version with just count and recent notifications
 *
 * @param locale - Display locale so polled notifications are translated to the
 *   correct language (en/ar). Without this, the server action falls back to
 *   header sniffing which is unreliable for client-initiated fetches.
 */
export function useNotificationBell(locale?: "ar" | "en") {
  const {
    isConnected,
    unreadCount,
    recentNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotifications({
    autoConnect: true,
    autoSubscribe: true,
    showToast: false, // Don't show toast for bell, it has its own UI
    locale,
  })

  return {
    isConnected,
    unreadCount,
    recentNotifications: recentNotifications.slice(0, 5), // Show only 5 in bell
    markAsRead,
    markAllAsRead,
    removeNotification,
  }
}

/**
 * Hook for notification center component
 * Full-featured version with all notifications
 */
export function useNotificationCenter(locale?: "ar" | "en") {
  const {
    isConnected,
    unreadCount,
    recentNotifications,
    markAsRead,
    markAllAsRead,
    clearRecent,
  } = useNotifications({
    autoConnect: true,
    autoSubscribe: true,
    showToast: true,
    locale,
  })

  return {
    isConnected,
    unreadCount,
    notifications: recentNotifications,
    markAsRead,
    markAllAsRead,
    clearRecent,
  }
}
