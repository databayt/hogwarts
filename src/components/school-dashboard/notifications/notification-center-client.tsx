"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import type { Dictionary } from "@/components/internationalization/dictionaries"

import { NotificationList } from "./list"
import type { NotificationDTO } from "./types"
import { useNotificationCenter } from "./use-notifications"

interface NotificationCenterClientProps {
  initialNotifications: NotificationDTO[]
  locale?: "ar" | "en"
  dictionary: Dictionary["notifications"]
  showFilters?: boolean
}

export function NotificationCenterClient({
  initialNotifications,
  locale = "en",
  dictionary,
  showFilters = true,
}: NotificationCenterClientProps) {
  const router = useRouter()
  const {
    isConnected,
    notifications: realtimeNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationCenter()

  // Merge initial notifications with real-time updates
  const [allNotifications, setAllNotifications] =
    useState<NotificationDTO[]>(initialNotifications)

  // Update local state when real-time notifications arrive
  useEffect(() => {
    if (realtimeNotifications.length > 0) {
      setAllNotifications((prev) => {
        // Create a map of existing notifications by ID
        const existingMap = new Map(prev.map((n) => [n.id, n]))

        // Add/update real-time notifications
        realtimeNotifications.forEach((n) => {
          existingMap.set(n.id, n)
        })

        // Convert back to array and sort by createdAt desc
        return Array.from(existingMap.values()).sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      })
    }
  }, [realtimeNotifications])

  // Sync initial notifications when they change (e.g., pagination)
  useEffect(() => {
    setAllNotifications(initialNotifications)
  }, [initialNotifications])

  const handleNotificationRead = async (notificationId: string) => {
    // Optimistic update
    setAllNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId
          ? { ...n, read: true, readAt: new Date().toISOString() }
          : n
      )
    )

    // Server update via hook
    await markAsRead(notificationId)
  }

  const handleNotificationDelete = (notificationId: string) => {
    // Optimistic update
    setAllNotifications((prev) => prev.filter((n) => n.id !== notificationId))

    // Refresh to get updated pagination
    setTimeout(() => {
      router.refresh()
    }, 500)
  }

  const handleMarkAllAsRead = async () => {
    // Optimistic update
    setAllNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() }))
    )

    // Server update via hook
    await markAllAsRead()

    // Refresh to get updated stats
    setTimeout(() => {
      router.refresh()
    }, 500)
  }

  return (
    <div className="relative">
      {/* Connection indicator */}
      {!isConnected && (
        <div className="text-muted-foreground absolute top-0 right-0 flex items-center gap-2 text-xs">
          <span className="bg-muted-foreground h-2 w-2 animate-pulse rounded-full" />
          <span>Connecting...</span>
        </div>
      )}

      <NotificationList
        notifications={allNotifications}
        locale={locale}
        dictionary={dictionary}
        onRead={handleNotificationRead}
        onDelete={handleNotificationDelete}
        onMarkAllRead={handleMarkAllAsRead}
        showFilters={showFilters}
        emptyMessage="No notifications yet. You're all caught up!"
      />
    </div>
  )
}
