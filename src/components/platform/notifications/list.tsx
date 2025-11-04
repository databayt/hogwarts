"use client"

import { useState } from "react"
import { NotificationCard, NotificationCardCompact } from "./card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { NotificationDTO } from "./types"
import { NotificationType, NotificationPriority } from "@prisma/client"

interface NotificationListProps {
  notifications: NotificationDTO[]
  locale?: "ar" | "en"
  onRead?: (notificationId: string) => void
  onDelete?: (notificationId: string) => void
  onMarkAllRead?: () => void
  compact?: boolean
  showFilters?: boolean
  emptyMessage?: string
  loading?: boolean
}

export function NotificationList({
  notifications,
  locale = "en",
  onRead,
  onDelete,
  onMarkAllRead,
  compact = false,
  showFilters = false,
  emptyMessage,
  loading = false,
}: NotificationListProps) {
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all")

  // Filter notifications with defensive check
  const filteredNotifications = (notifications ?? []).filter((notification) => {
    if (filter === "unread" && notification.read) return false
    if (typeFilter !== "all" && notification.type !== typeFilter) return false
    return true
  })

  const unreadCount = (notifications ?? []).filter((n) => !n.read).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if ((notifications?.length ?? 0) === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Bell className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-medium text-foreground mb-1">No notifications</h3>
        <p className="text-sm text-muted-foreground">
          {emptyMessage || "You're all caught up!"}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      {showFilters && (
        <div className="flex items-center justify-between">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {unreadCount > 0 && onMarkAllRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllRead}
              className="gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>
      )}

      {/* Notification List */}
      {filteredNotifications.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            {filter === "unread"
              ? "No unread notifications"
              : "No notifications match the filter"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) =>
            compact ? (
              <NotificationCardCompact
                key={notification.id}
                notification={notification}
                locale={locale}
                onRead={onRead}
                onDelete={onDelete}
              />
            ) : (
              <NotificationCard
                key={notification.id}
                notification={notification}
                locale={locale}
                onRead={onRead}
                onDelete={onDelete}
              />
            )
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Notification list with scroll area for dropdowns/popovers
 */
export function NotificationListScrollable({
  notifications,
  locale,
  onRead,
  onDelete,
  onMarkAllRead,
  maxHeight = 400,
}: NotificationListProps & { maxHeight?: number }) {
  const unreadCount = (notifications ?? []).filter((n) => !n.read).length

  return (
    <div className="w-full">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {unreadCount} unread
              </p>
            )}
          </div>
          {unreadCount > 0 && onMarkAllRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllRead}
              className="h-8 text-xs"
            >
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable List */}
      <ScrollArea className="h-full" style={{ maxHeight }}>
        {(notifications?.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <Bell className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No notifications</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {(notifications ?? []).map((notification) => (
              <NotificationCardCompact
                key={notification.id}
                notification={notification}
                locale={locale}
                onRead={onRead}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {(notifications?.length ?? 0) > 0 && (
        <div className="px-4 py-3 border-t">
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <a href="/notifications">View all notifications</a>
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * Grouped notification list by date
 */
export function NotificationListGrouped({
  notifications,
  locale,
  onRead,
  onDelete,
}: Omit<NotificationListProps, "onMarkAllRead" | "compact">) {
  // Group by date with defensive check
  const grouped = (notifications ?? []).reduce(
    (acc, notification) => {
      const date = new Date(notification.createdAt)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      let key = "Older"
      if (date.toDateString() === today.toDateString()) {
        key = "Today"
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = "Yesterday"
      }

      if (!acc[key]) acc[key] = []
      acc[key].push(notification)
      return acc
    },
    {} as Record<string, NotificationDTO[]>
  )

  const order = ["Today", "Yesterday", "Older"]
  const sortedGroups = order.filter((key) => grouped[key])

  if (sortedGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Bell className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-medium text-foreground mb-1">No notifications</h3>
        <p className="text-sm text-muted-foreground">You're all caught up!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {sortedGroups.map((group) => (
        <div key={group} className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">{group}</h4>
          <div className="space-y-2">
            {grouped[group].map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                locale={locale}
                onRead={onRead}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
