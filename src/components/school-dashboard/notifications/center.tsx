"use client"

import * as React from "react"
import { useCallback, useMemo, useState, useTransition } from "react"
import type { NotificationPriority, NotificationType } from "@prisma/client"
import {
  differenceInDays,
  format,
  formatDistanceToNow,
  isPast,
  isToday,
  isYesterday,
  startOfDay,
} from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { AnimatePresence, motion } from "framer-motion"
import {
  Archive,
  Award,
  Bell,
  BookOpen,
  Calendar,
  Check,
  CheckCheck,
  DollarSign,
  Filter,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Settings,
  Star,
  Trash2,
  TriangleAlert,
  Users,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { NOTIFICATION_TYPE_CONFIG, PRIORITY_CONFIG } from "./config"
import type { NotificationDTO } from "./types"

// Notification type icons using existing config
const typeIcons: Record<string, React.ElementType> = {
  message: MessageSquare,
  message_mention: MessageSquare,
  assignment_created: BookOpen,
  assignment_due: Calendar,
  assignment_graded: Award,
  grade_posted: Award,
  attendance_marked: Users,
  attendance_alert: TriangleAlert,
  fee_due: DollarSign,
  fee_overdue: TriangleAlert,
  fee_paid: DollarSign,
  announcement: Bell,
  event_reminder: Calendar,
  class_cancelled: TriangleAlert,
  class_rescheduled: Calendar,
  system_alert: Bell,
  account_created: Users,
  password_reset: Settings,
  login_alert: TriangleAlert,
  document_shared: BookOpen,
  report_ready: Award,
}

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

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications

    // Tab filter
    if (selectedTab === "unread") {
      filtered = filtered.filter((n) => !n.read)
    }

    // Type filter
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((n) => selectedTypes.includes(n.type))
    }

    // Sort by priority (urgent first) then by date
    return filtered.sort((a, b) => {
      if (a.priority === "urgent" && b.priority !== "urgent") return -1
      if (b.priority === "urgent" && a.priority !== "urgent") return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [notifications, selectedTab, selectedTypes])

  // Group notifications by date
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

  // Statistics
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
            toast({
              title: dictionary.success.markedAsRead,
            })
            break
          case "archive":
            if (onArchive) {
              await onArchive(selectedNotifications)
              toast({
                title: dictionary.success.archived,
              })
            }
            break
          case "delete":
            await onDelete(selectedNotifications)
            toast({
              title: dictionary.success.deleted,
            })
            break
        }
        setSelectedNotifications([])
        setBulkActionMode(false)
      } catch {
        toast({
          title: dictionary.errors.title,
        })
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([])
    } else {
      setSelectedNotifications(filteredNotifications.map((n) => n.id))
    }
  }

  const NotificationItem = ({
    notification,
  }: {
    notification: NotificationDTO
  }) => {
    const Icon = typeIcons[notification.type] || Bell
    const priorityConfig = PRIORITY_CONFIG[notification.priority]

    const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
      addSuffix: true,
      locale: locale === "ar" ? ar : enUS,
    })

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className={cn(
          "group flex items-start gap-3 rounded-lg p-4 transition-colors",
          !notification.read && "bg-accent/50",
          notification.priority === "urgent" &&
            !notification.read &&
            "border-s-destructive border-s-4"
        )}
      >
        {bulkActionMode && (
          <Checkbox
            checked={selectedNotifications.includes(notification.id)}
            onCheckedChange={(checked) => {
              if (checked) {
                setSelectedNotifications((prev) => [...prev, notification.id])
              } else {
                setSelectedNotifications((prev) =>
                  prev.filter((id) => id !== notification.id)
                )
              }
            }}
            className="mt-1"
          />
        )}

        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            notification.priority === "urgent"
              ? "bg-destructive/10"
              : "bg-muted"
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5",
              notification.priority === "urgent"
                ? "text-destructive"
                : "text-muted-foreground"
            )}
          />
          {notification.priority === "urgent" && !notification.read && (
            <span className="absolute -top-1 inline-flex h-3 w-3 ltr:-right-1 rtl:-left-1">
              <span className="bg-destructive absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
              <span className="bg-destructive relative inline-flex h-3 w-3 rounded-full" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "truncate text-sm",
                  !notification.read
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground font-medium"
                )}
              >
                {notification.title}
              </p>
              {notification.actor && (
                <p className="text-muted-foreground text-xs">
                  {notification.actor.username || notification.actor.email}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {notification.priority !== "normal" && (
                <Badge
                  variant={priorityConfig.badgeVariant}
                  className="text-xs"
                >
                  {dictionary.priorities.badge[notification.priority]}
                </Badge>
              )}
              <span className="text-muted-foreground text-xs whitespace-nowrap">
                {timeAgo}
              </span>
            </div>
          </div>

          <p className="text-muted-foreground mb-2 line-clamp-2 text-sm">
            {notification.body}
          </p>

          {notification.metadata &&
            typeof notification.metadata === "object" &&
            "url" in notification.metadata && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onActionClick?.(notification)}
                className="mb-2"
              >
                {dictionary.actions.viewDetails}
              </Button>
            )}
        </div>

        {!bulkActionMode && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
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
                <DropdownMenuItem onClick={() => onArchive([notification.id])}>
                  <Archive className="me-2 h-4 w-4" />
                  {dictionary.actions.archive}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete([notification.id])}
              >
                <Trash2 className="me-2 h-4 w-4" />
                {dictionary.actions.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </motion.div>
    )
  }

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
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground text-sm">
                    {dictionary.filters.filterBy}:
                  </span>
                  {Object.entries(typeIcons)
                    .slice(0, 8)
                    .map(([type, Icon]) => (
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
                        <Icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">
                          {dictionary.types[type as NotificationType] || type}
                        </span>
                      </Button>
                    ))}
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
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs & Notification List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
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
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <AnimatePresence mode="popLayout">
              {Object.keys(groupedNotifications).length > 0 ? (
                <div className="space-y-4 p-4">
                  {Object.entries(groupedNotifications).map(
                    ([date, notifications]) => (
                      <div key={date}>
                        <h3 className="text-muted-foreground bg-card sticky top-0 mb-2 py-1 text-sm font-medium">
                          {date}
                        </h3>
                        <div className="space-y-1">
                          {notifications.map((notification) => (
                            <NotificationItem
                              key={notification.id}
                              notification={notification}
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
        </CardContent>
      </Card>
    </div>
  )
}
