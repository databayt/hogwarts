"use client"

import { useState, useTransition } from "react"
import { NotificationCard, NotificationCardCompact } from "./card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import type { NotificationDTO } from "./types"
import { NotificationType } from "@prisma/client"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface NotificationListProps {
  notifications: NotificationDTO[]
  locale?: "ar" | "en"
  dictionary: Dictionary["notifications"]
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
  dictionary,
  onRead,
  onDelete,
  onMarkAllRead,
  compact = false,
  showFilters = false,
  emptyMessage,
  loading = false,
}: NotificationListProps) {
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const [isPending, startTransition] = useTransition()

  // Filter notifications with defensive check
  const filteredNotifications = (notifications ?? []).filter((notification) => {
    if (filter === "unread" && notification.read) return false
    return true
  })

  const unreadCount = (notifications ?? []).filter((n) => !n.read).length

  const handleMarkAllRead = () => {
    startTransition(() => {
      onMarkAllRead?.()
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if ((notifications?.length ?? 0) === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div className="rounded-full bg-muted p-4 mb-4">
          <Bell className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="scroll-m-20 text-lg font-semibold tracking-tight mb-1">
          {dictionary.empty.noNotifications}
        </h3>
        <p className="text-sm text-muted-foreground max-w-[250px]">
          {emptyMessage || dictionary.empty.noNotificationsDescription}
        </p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      {showFilters && (
        <div className="flex items-center justify-between">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList>
              <TabsTrigger value="all">{dictionary.tabs.all}</TabsTrigger>
              <TabsTrigger value="unread">
                {dictionary.tabs.unread} {unreadCount > 0 && `(${unreadCount})`}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {unreadCount > 0 && onMarkAllRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={isPending}
              className="gap-2"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              {dictionary.markAllAsRead}
            </Button>
          )}
        </div>
      )}

      {/* Notification List */}
      {filteredNotifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-8 text-center"
        >
          <p className="text-sm text-muted-foreground">
            {filter === "unread"
              ? dictionary.empty.noUnread
              : dictionary.empty.noResults}
          </p>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-2">
            {filteredNotifications.map((notification) =>
              compact ? (
                <NotificationCardCompact
                  key={notification.id}
                  notification={notification}
                  locale={locale}
                  dictionary={dictionary}
                  onRead={onRead}
                  onDelete={onDelete}
                />
              ) : (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  locale={locale}
                  dictionary={dictionary}
                  onRead={onRead}
                  onDelete={onDelete}
                />
              )
            )}
          </div>
        </AnimatePresence>
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
  dictionary,
  onRead,
  onDelete,
  onMarkAllRead,
  maxHeight = 400,
}: NotificationListProps & { maxHeight?: number }) {
  const [isPending, startTransition] = useTransition()
  const unreadCount = (notifications ?? []).filter((n) => !n.read).length

  const handleMarkAllRead = () => {
    startTransition(() => {
      onMarkAllRead?.()
    })
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">{dictionary.notificationCenter}</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {unreadCount > 1
                  ? dictionary.unreadCount_other.replace('{{count}}', unreadCount.toString())
                  : dictionary.unreadCount_one.replace('{{count}}', '1')}
              </p>
            )}
          </div>
          {unreadCount > 0 && onMarkAllRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={isPending}
              className="h-8 text-xs"
            >
              {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin me-1" />
              ) : (
                <CheckCheck className="h-3 w-3 me-1" />
              )}
              {dictionary.markAllAsRead}
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable List */}
      <ScrollArea className="h-full" style={{ maxHeight }}>
        {(notifications?.length ?? 0) === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-8 text-center px-4"
          >
            <div className="rounded-full bg-muted p-3 mb-3">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{dictionary.empty.noNotifications}</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="p-2 space-y-1">
              {(notifications ?? []).map((notification) => (
                <NotificationCardCompact
                  key={notification.id}
                  notification={notification}
                  locale={locale}
                  dictionary={dictionary}
                  onRead={onRead}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </ScrollArea>

      {/* Footer */}
      {(notifications?.length ?? 0) > 0 && (
        <div className="px-4 py-3 border-t bg-card">
          <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
            <a href={`/${locale}/notifications`}>{dictionary.viewAll}</a>
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
  dictionary,
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
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div className="rounded-full bg-muted p-4 mb-4">
          <Bell className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="scroll-m-20 text-lg font-semibold tracking-tight mb-1">
          {dictionary.empty.noNotifications}
        </h3>
        <p className="text-sm text-muted-foreground">
          {dictionary.empty.noNotificationsDescription}
        </p>
      </motion.div>
    )
  }

  // Map group keys to dictionary labels
  const groupLabels: Record<string, string> = {
    "Today": dictionary.grouping.today,
    "Yesterday": dictionary.grouping.yesterday,
    "Older": dictionary.grouping.older,
  }

  return (
    <div className="space-y-6">
      <AnimatePresence mode="popLayout">
        {sortedGroups.map((group) => (
          <motion.div
            key={group}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h4 className="text-sm font-medium text-muted-foreground sticky top-0 bg-background py-1">
              {groupLabels[group]}
            </h4>
            <div className="space-y-2">
              {grouped[group].map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  locale={locale}
                  dictionary={dictionary}
                  onRead={onRead}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
