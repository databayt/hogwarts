"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"

import socketService from "@/lib/websocket/socket-service"
import { toast } from "@/components/ui/use-toast"

import { markAllNotificationsAsRead, markNotificationAsRead } from "./actions"
import { NOTIFICATION_TYPE_CONFIG } from "./config"
import type { NotificationDTO } from "./types"

interface UseNotificationsOptions {
  autoConnect?: boolean
  autoSubscribe?: boolean
  showToast?: boolean
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
  clearRecent: () => void
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
 * - CLEANUP: Removes listeners on unmount to prevent memory leaks
 *
 * GOTCHAS:
 * - Must call connect() before events are subscribed (check isConnected)
 * - Toast disabled by default in NotificationBell (UI has own display)
 * - Unread count may be stale if multiple tabs open (no cross-tab sync)
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
  const unsubscribers = useRef<Array<() => void>>([])

  const connect = useCallback(async () => {
    if (!session?.user) {
      console.warn("No session available for WebSocket connection")
      return
    }

    try {
      await socketService.connect(
        session.user.schoolId || "",
        session.user.id || "",
        session.user.role
      )
      setIsConnected(true)

      // Subscribe to notifications if enabled
      if (options.autoSubscribe !== false) {
        socketService.subscribeToNotifications(session.user.id)
      }
    } catch (error) {
      console.error("Failed to connect WebSocket:", error)
      setIsConnected(false)
    }
  }, [session, options.autoSubscribe])

  const disconnect = useCallback(() => {
    if (session?.user?.id) {
      socketService.unsubscribeFromNotifications(session.user.id)
    }
    socketService.disconnect()
    setIsConnected(false)
  }, [session])

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
        setUnreadCount((prev) => prev + 1)
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (!session?.user?.id) return

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
      socketService.markAllNotificationsRead(session.user.id)

      // Also call server action for persistence
      const result = await markAllNotificationsAsRead({
        userId: session.user.id,
      })
      if (!result.success) {
        console.error("Failed to mark all notifications as read:", result.error)
        // Revert optimistic update
        setUnreadCount(previousCount)
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }, [session, unreadCount])

  const clearRecent = useCallback(() => {
    setRecentNotifications([])
  }, [])

  // Auto-connect if enabled
  useEffect(() => {
    if (options.autoConnect && session?.user) {
      connect()
    }

    return () => {
      if (options.autoConnect) {
        disconnect()
      }
    }
  }, [options.autoConnect, session, connect, disconnect])

  // Set up notification event listeners
  useEffect(() => {
    if (!isConnected) return

    const subscriptions: Array<() => void> = []

    // Listen for new notifications
    subscriptions.push(
      socketService.on("notification:new", (data) => {
        const notification: NotificationDTO = {
          id: data.id,
          schoolId: session?.user?.schoolId || "",
          userId: session?.user?.id || "",
          type: data.type as any,
          priority: data.priority as any,
          title: data.title,
          body: data.body,
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
          const config = NOTIFICATION_TYPE_CONFIG[notification.type]
          toast({
            title: notification.title,
            description: notification.body,
            // @ts-ignore - variant exists
            variant:
              notification.priority === "urgent" ? "destructive" : "default",
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
    session,
    options.showToast,
    options.onNewNotification,
    options.onNotificationRead,
    options.onNotificationDeleted,
  ])

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      unsubscribers.current.forEach((unsubscribe) => unsubscribe())
      unsubscribers.current = []
    }
  }, [])

  return {
    isConnected,
    unreadCount,
    recentNotifications,
    connect,
    disconnect,
    markAsRead,
    markAllAsRead,
    clearRecent,
  }
}

/**
 * Hook for notification bell component
 * Simplified version with just count and recent notifications
 */
export function useNotificationBell() {
  const {
    isConnected,
    unreadCount,
    recentNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications({
    autoConnect: true,
    autoSubscribe: true,
    showToast: false, // Don't show toast for bell, it has its own UI
  })

  return {
    isConnected,
    unreadCount,
    recentNotifications: recentNotifications.slice(0, 5), // Show only 5 in bell
    markAsRead,
    markAllAsRead,
  }
}

/**
 * Hook for notification center component
 * Full-featured version with all notifications
 */
export function useNotificationCenter() {
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
