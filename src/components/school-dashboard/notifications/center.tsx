"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { memo, useCallback, useMemo, useState, useTransition } from "react"
import type { NotificationType } from "@prisma/client"
import {
  differenceInDays,
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  startOfDay,
} from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { AnimatePresence, motion } from "framer-motion"
import {
  Archive,
  Bell,
  Check,
  CheckCheck,
  Filter,
  Loader2,
  MoreHorizontal,
  Star,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { NOTIFICATION_TYPE_CONFIG, PRIORITY_CONFIG } from "./config"
import type { NotificationDTO } from "./types"

interface NotificationCenterProps {
  notifications: NotificationDTO[]
  locale?: "ar" | "en"
  dictionary: Dictionary["notifications"]
  onMarkAsRead: (notificationIds: string[]) => Promise<void>
  onMarkAllAsRead: () => Promise<void>
  onDelete: (notificationIds: string[]) => Promise<void>
  onArchive?: (notificationIds: string[]) => Promise<void>
  onStar?: (notificationId: string) => Promise<void>
  onActionClick?: (notification: NotificationDTO) => void
  showBulkActions?: boolean
}

function formatNotificationDate(dateStr: string, locale: "ar" | "en") {
  const date = new Date(dateStr)
  const days = differenceInDays(new Date(), date)
  const dateLocale = locale === "ar" ? ar : enUS

  if (days < 7) {
    return formatDistanceToNow(date, { addSuffix: true, locale: dateLocale })
  }
  return format(date, "MMM d, yyyy", { locale: dateLocale })
}

// ============================================================================
// NotificationItem — top-level memoized to avoid re-creation on every render
// ============================================================================

interface NotificationItemProps {
  notification: NotificationDTO
  locale: "ar" | "en"
  dictionary: Dictionary["notifications"]
  bulkActionMode: boolean
  selected: boolean
  onToggleSelect: (id: string, checked: boolean) => void
  onMarkAsRead: (ids: string[]) => void
  onDelete: (ids: string[]) => void
  onArchive?: (ids: string[]) => void
  onStar?: (id: string) => void
  onActionClick?: (notification: NotificationDTO) => void
}

const NotificationItem = memo(function NotificationItem({
  notification,
  locale,
  dictionary,
  bulkActionMode,
  selected,
  onToggleSelect,
  onMarkAsRead,
  onDelete,
  onArchive,
  onStar,
  onActionClick,
}: NotificationItemProps) {
  const config = NOTIFICATION_TYPE_CONFIG[notification.type]
  const Icon = config?.icon ?? Bell
  const priorityConfig = PRIORITY_CONFIG[notification.priority]
  const actorName =
    notification.actor?.username || notification.actor?.email || ""
  const formattedDate = formatNotificationDate(notification.createdAt, locale)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: locale === "ar" ? 20 : -20 }}
      transition={{ duration: 0.15 }}
    >
      <div
        className={cn(
          "group relative flex gap-3 border-b px-4 py-3 transition-colors",
          !notification.read ? "bg-accent/30" : "hover:bg-accent/50",
          notification.priority === "urgent" &&
            !notification.read &&
            "border-s-destructive border-s-4"
        )}
        role="article"
        aria-label={`${
          notification.read
            ? dictionary.accessibility.readNotification
            : dictionary.accessibility.unreadNotification
        }: ${notification.title}`}
      >
        {/* Bulk select checkbox */}
        {bulkActionMode && (
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => {
              onToggleSelect(notification.id, !!checked)
            }}
            className="mt-2 flex-shrink-0"
          />
        )}

        {/* Avatar / Type icon */}
        <div className="relative flex-shrink-0">
          {notification.actor?.image ? (
            <Avatar className="h-10 w-10">
              <AvatarImage src={notification.actor.image} alt={actorName} />
              <AvatarFallback className="bg-muted">
                <Icon className="text-muted-foreground h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          ) : (
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                notification.priority === "urgent"
                  ? "bg-destructive/10"
                  : "bg-muted"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  notification.priority === "urgent"
                    ? "text-destructive"
                    : "text-muted-foreground"
                )}
              />
            </div>
          )}

          {/* Unread dot */}
          {!notification.read && (
            <span className="bg-primary absolute -top-0.5 block h-2.5 w-2.5 rounded-full ring-2 ring-white ltr:-right-0.5 rtl:-left-0.5 dark:ring-gray-950" />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "line-clamp-3 text-sm",
              notification.read ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {actorName && (
              <strong className="font-semibold">{actorName} </strong>
            )}
            {notification.title}
            {notification.body && notification.title !== notification.body && (
              <>
                {". "}
                <span className="text-muted-foreground">
                  {notification.body}
                </span>
              </>
            )}
          </p>

          <div className="mt-1 flex items-center gap-2">
            <time
              dateTime={notification.createdAt}
              className="text-muted-foreground text-xs"
            >
              {formattedDate}
            </time>

            {notification.priority !== "normal" && (
              <Badge variant={priorityConfig.badgeVariant} className="text-xs">
                {dictionary.priorities.badge[notification.priority]}
              </Badge>
            )}
          </div>

          {notification.metadata &&
            typeof notification.metadata === "object" &&
            "url" in notification.metadata && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onActionClick?.(notification)}
                className="mt-2"
              >
                {dictionary.actions.viewDetails}
              </Button>
            )}
        </div>

        {/* Actions: X dismiss always visible, dropdown on hover */}
        {!bulkActionMode && (
          <div className="flex flex-shrink-0 items-start gap-1 pt-0.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                  <span className="sr-only">{dictionary.actions.settings}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!notification.read && (
                  <DropdownMenuItem
                    onClick={() => onMarkAsRead([notification.id])}
                  >
                    <Check className="me-2 h-4 w-4" />
                    {dictionary.actions.markAsRead}
                  </DropdownMenuItem>
                )}
                {onStar && (
                  <DropdownMenuItem onClick={() => onStar(notification.id)}>
                    <Star className="me-2 h-4 w-4" />
                    {dictionary.actions.star}
                  </DropdownMenuItem>
                )}
                {onArchive && (
                  <DropdownMenuItem
                    onClick={() => onArchive([notification.id])}
                  >
                    <Archive className="me-2 h-4 w-4" />
                    {dictionary.actions.archive}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete([notification.id])}
                >
                  <X className="me-2 h-4 w-4" />
                  {dictionary.actions.delete}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground h-7 w-7"
              onClick={() => onDelete([notification.id])}
              aria-label={dictionary.accessibility.deleteButton}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )
})

// ============================================================================
// NotificationCenter
// ============================================================================

export function NotificationCenter({
  notifications,
  locale = "en",
  dictionary,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onArchive,
  onStar,
  onActionClick,
  showBulkActions = true,
}: NotificationCenterProps) {
  const [isPending, startTransition] = useTransition()
  const [selectedTab, setSelectedTab] = useState<"all" | "unread">("all")
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
    []
  )
  const [bulkActionMode, setBulkActionMode] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const filteredNotifications = useMemo(() => {
    let filtered = notifications

    if (selectedTab === "unread") {
      filtered = filtered.filter((n) => !n.read)
    }

    if (selectedTypes.length > 0) {
      filtered = filtered.filter((n) => selectedTypes.includes(n.type))
    }

    return filtered.sort((a, b) => {
      if (a.priority === "urgent" && b.priority !== "urgent") return -1
      if (b.priority === "urgent" && a.priority !== "urgent") return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [notifications, selectedTab, selectedTypes])

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, NotificationDTO[]> = {}

    filteredNotifications.forEach((notification) => {
      const date = startOfDay(new Date(notification.createdAt))
      const key = isToday(date)
        ? dictionary.grouping.today
        : isYesterday(date)
          ? dictionary.grouping.yesterday
          : differenceInDays(new Date(), date) < 7
            ? format(date, "EEEE", { locale: locale === "ar" ? ar : enUS })
            : format(date, "MMM dd, yyyy", {
                locale: locale === "ar" ? ar : enUS,
              })

      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(notification)
    })

    return groups
  }, [filteredNotifications, dictionary, locale])

  const stats = useMemo(() => {
    const unreadCount = notifications.filter((n) => !n.read).length
    const urgentCount = notifications.filter(
      (n) => n.priority === "urgent" && !n.read
    ).length

    return { unreadCount, urgentCount }
  }, [notifications])

  const handleBulkAction = async (action: "read" | "archive" | "delete") => {
    if (selectedNotifications.length === 0) {
      toast({
        title: dictionary.errors.title,
        description: dictionary.empty.noNotifications,
      })
      return
    }

    startTransition(async () => {
      try {
        switch (action) {
          case "read":
            await onMarkAsRead(selectedNotifications)
            toast({ title: dictionary.success.markedAsRead })
            break
          case "archive":
            if (onArchive) {
              await onArchive(selectedNotifications)
              toast({ title: dictionary.success.archived })
            }
            break
          case "delete":
            await onDelete(selectedNotifications)
            toast({ title: dictionary.success.deleted })
            break
        }
        setSelectedNotifications([])
        setBulkActionMode(false)
      } catch {
        toast({ title: dictionary.errors.title })
      }
    })
  }

  const handleToggleSelect = useCallback((id: string, checked: boolean) => {
    if (checked) {
      setSelectedNotifications((prev) => [...prev, id])
    } else {
      setSelectedNotifications((prev) => prev.filter((i) => i !== id))
    }
  }, [])

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([])
    } else {
      setSelectedNotifications(filteredNotifications.map((n) => n.id))
    }
  }

  // Filter bar types from config (first 8 entries)
  const filterTypes = useMemo(
    () => Object.entries(NOTIFICATION_TYPE_CONFIG).slice(0, 8),
    []
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight">
            {dictionary.title}
          </h2>
          {stats.unreadCount > 0 && (
            <Badge variant="secondary">{stats.unreadCount}</Badge>
          )}
          {stats.urgentCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {stats.urgentCount} {dictionary.priorities.badge.urgent}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showBulkActions && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBulkActionMode(!bulkActionMode)
                setSelectedNotifications([])
              }}
            >
              {bulkActionMode
                ? dictionary.confirmations.cancel
                : dictionary.bulk.selectAll.split(" ")[0]}
            </Button>
          )}

          {bulkActionMode && selectedNotifications.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("read")}
                disabled={isPending}
              >
                {isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {dictionary.actions.markAsRead}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("delete")}
                disabled={isPending}
              >
                {dictionary.actions.delete}
              </Button>
            </>
          )}

          {!bulkActionMode && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(showFilters && "bg-accent")}
              >
                <Filter className="h-4 w-4" />
                <span className="sr-only">{dictionary.filters.filterBy}</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  startTransition(async () => {
                    await onMarkAllAsRead()
                  })
                }
                disabled={stats.unreadCount === 0 || isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCheck className="h-4 w-4" />
                )}
                <span className="sr-only">{dictionary.markAllAsRead}</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground text-sm">
                  {dictionary.filters.filterBy}:
                </span>
                {filterTypes.map(([type, typeConfig]) => {
                  const TypeIcon = typeConfig.icon
                  return (
                    <Button
                      key={type}
                      variant={
                        selectedTypes.includes(type) ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        if (selectedTypes.includes(type)) {
                          setSelectedTypes((prev) =>
                            prev.filter((t) => t !== type)
                          )
                        } else {
                          setSelectedTypes((prev) => [...prev, type])
                        }
                      }}
                      className="gap-1"
                    >
                      <TypeIcon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">
                        {dictionary.types[type as NotificationType] || type}
                      </span>
                    </Button>
                  )
                })}
                {selectedTypes.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTypes([])}
                  >
                    <X className="me-1 h-4 w-4" />
                    {dictionary.filters.clearFilters}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs & Notification List */}
      <div className="rounded-lg border">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <Tabs
            value={selectedTab}
            onValueChange={(v) => setSelectedTab(v as typeof selectedTab)}
          >
            <TabsList>
              <TabsTrigger value="all">
                {dictionary.tabs.all}
                {notifications.length > 0 && (
                  <Badge variant="outline" className="ms-2">
                    {notifications.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="unread">
                {dictionary.tabs.unread}
                {stats.unreadCount > 0 && (
                  <Badge variant="destructive" className="ms-2">
                    {stats.unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {bulkActionMode && filteredNotifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleSelectAll}>
              {selectedNotifications.length === filteredNotifications.length
                ? dictionary.bulk.deselectAll
                : dictionary.bulk.selectAll}
            </Button>
          )}
        </div>

        <ScrollArea className="h-[500px]">
          <AnimatePresence mode="popLayout">
            {Object.keys(groupedNotifications).length > 0 ? (
              <div>
                {Object.entries(groupedNotifications).map(
                  ([date, groupNotifications]) => (
                    <div key={date}>
                      <div className="bg-background sticky top-0 border-b px-4 py-2">
                        <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                          {date}
                        </h3>
                      </div>
                      <div>
                        {groupNotifications.map((notification) => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            locale={locale}
                            dictionary={dictionary}
                            bulkActionMode={bulkActionMode}
                            selected={selectedNotifications.includes(
                              notification.id
                            )}
                            onToggleSelect={handleToggleSelect}
                            onMarkAsRead={onMarkAsRead}
                            onDelete={onDelete}
                            onArchive={onArchive}
                            onStar={onStar}
                            onActionClick={onActionClick}
                          />
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16"
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
            )}
          </AnimatePresence>
        </ScrollArea>
      </div>
    </div>
  )
}
