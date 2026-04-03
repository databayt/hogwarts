"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { Bell, CheckCheck, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { NotificationCard, NotificationCardCompact } from "./card"
import type { NotificationDTO } from "./types"

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

/**
 * Skeleton loader matching Airbnb notification item layout
 */
function NotificationSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3 border-b px-3 py-2.5">
          <Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-5 w-5 flex-shrink-0 rounded" />
        </div>
      ))}
    </div>
  )
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
    return <NotificationSkeleton count={5} />
  }

  if ((notifications?.length ?? 0) === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div className="bg-muted mb-4 rounded-full p-4">
          <Bell className="text-muted-foreground h-8 w-8" />
        </div>
        <h3 className="mb-1 scroll-m-20 text-lg font-semibold tracking-tight">
          {dictionary.empty.noNotifications}
        </h3>
        <p className="text-muted-foreground max-w-[250px] text-sm">
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
          <Tabs
            value={filter}
            onValueChange={(v) => setFilter(v as typeof filter)}
          >
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
          <p className="text-muted-foreground text-sm">
            {filter === "unread"
              ? dictionary.empty.noUnread
              : dictionary.empty.noResults}
          </p>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div>
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
 * Airbnb-inspired notification list for bell dropdown
 */
export function NotificationListScrollable({
  notifications,
  locale,
  dictionary,
  onRead,
  onDelete,
  onMarkAllRead,
  maxHeight = 450,
  loading = false,
}: NotificationListProps & { maxHeight?: number }) {
  const [isPending, startTransition] = useTransition()
  const unreadCount = (notifications ?? []).filter((n) => !n.read).length

  const handleMarkAllRead = () => {
    startTransition(() => {
      onMarkAllRead?.()
    })
  }

  return (
    <div className="w-full" dir={locale === "ar" ? "rtl" : "ltr"}>
      {/* Header - clean Airbnb style */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-base font-semibold">{dictionary.title}</h3>
        {unreadCount > 0 && onMarkAllRead && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="text-muted-foreground hover:text-foreground h-auto px-2 py-1 text-xs"
          >
            {isPending ? (
              <Loader2 className="me-1 h-3 w-3 animate-spin" />
            ) : (
              <CheckCheck className="me-1 h-3 w-3" />
            )}
            {dictionary.markAllAsRead}
          </Button>
        )}
      </div>

      {/* Scrollable List */}
      <ScrollArea className="h-full" style={{ maxHeight }}>
        {loading ? (
          <NotificationSkeleton count={4} />
        ) : (notifications?.length ?? 0) === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center px-4 py-8 text-center"
          >
            <div className="bg-muted mb-3 rounded-full p-3">
              <Bell className="text-muted-foreground h-6 w-6" />
            </div>
            <p className="text-muted-foreground text-sm">
              {dictionary.empty.noNotifications}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div>
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
        <div className="border-t px-4 py-2.5">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground w-full text-xs"
            asChild
          >
            <Link href={`/${locale}/notifications`}>{dictionary.viewAll}</Link>
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
  const grouped = (notifications ?? []).reduce(
    (acc, notification) => {
      const date = new Date(notification.createdAt)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      let key = "older"
      if (date.toDateString() === today.toDateString()) {
        key = "today"
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = "yesterday"
      }

      if (!acc[key]) acc[key] = []
      acc[key].push(notification)
      return acc
    },
    {} as Record<string, NotificationDTO[]>
  )

  const order = ["today", "yesterday", "older"]
  const sortedGroups = order.filter((key) => grouped[key])

  if (sortedGroups.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div className="bg-muted mb-4 rounded-full p-4">
          <Bell className="text-muted-foreground h-8 w-8" />
        </div>
        <h3 className="mb-1 scroll-m-20 text-lg font-semibold tracking-tight">
          {dictionary.empty.noNotifications}
        </h3>
        <p className="text-muted-foreground text-sm">
          {dictionary.empty.noNotificationsDescription}
        </p>
      </motion.div>
    )
  }

  const groupLabels: Record<string, string> = {
    today: dictionary.grouping.today,
    yesterday: dictionary.grouping.yesterday,
    older: dictionary.grouping.older,
  }

  return (
    <div>
      <AnimatePresence mode="popLayout">
        {sortedGroups.map((group) => (
          <motion.div
            key={group}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h4 className="text-muted-foreground bg-background sticky top-0 px-4 py-2 text-xs font-medium tracking-wider uppercase">
              {groupLabels[group]}
            </h4>
            <div>
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

export { NotificationSkeleton }
