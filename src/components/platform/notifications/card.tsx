"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { motion } from "framer-motion"
import { Check, Loader2, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { deleteNotification, markNotificationAsRead } from "./actions"
import { NOTIFICATION_TYPE_CONFIG, PRIORITY_CONFIG } from "./config"
import type { NotificationDTO } from "./types"

interface NotificationCardProps {
  notification: NotificationDTO
  locale?: "ar" | "en"
  dictionary: Dictionary["notifications"]
  onRead?: (notificationId: string) => void
  onDelete?: (notificationId: string) => void
  compact?: boolean
}

export function NotificationCard({
  notification,
  locale = "en",
  dictionary,
  onRead,
  onDelete,
  compact = false,
}: NotificationCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)

  const config = NOTIFICATION_TYPE_CONFIG[notification.type]
  const priorityConfig = PRIORITY_CONFIG[notification.priority]
  const Icon = config.icon

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (notification.read) return

    startTransition(async () => {
      const result = await markNotificationAsRead({
        notificationId: notification.id,
      })

      if (result.success) {
        onRead?.(notification.id)
        toast({
          title: dictionary.success.markedAsRead,
        })
      } else {
        toast({
          title: dictionary.errors.markAsReadFailed,
          description: result.error,
        })
      }
    })
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDeleting(true)

    const result = await deleteNotification({
      notificationId: notification.id,
    })

    if (result.success) {
      onDelete?.(notification.id)
      toast({
        title: dictionary.success.deleted,
      })
    } else {
      toast({
        title: dictionary.errors.deleteFailed,
        description: result.error,
      })
      setIsDeleting(false)
    }
  }

  const handleClick = () => {
    // Mark as read on click
    if (!notification.read) {
      handleMarkAsRead({} as React.MouseEvent)
    }

    // Navigate to related content if metadata has URL
    if (notification.metadata && typeof notification.metadata === "object") {
      const metadata = notification.metadata as Record<string, unknown>
      if (metadata.url && typeof metadata.url === "string") {
        router.push(metadata.url)
      }
    }
  }

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: locale === "ar" ? ar : enUS,
  })

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "hover:bg-accent/50 relative cursor-pointer transition-all duration-200 hover:shadow-sm",
          !notification.read && "bg-accent/30 border-l-primary border-l-4",
          notification.priority === "urgent" &&
            !notification.read &&
            "border-l-destructive",
          compact ? "p-3" : "p-4",
          isDeleting && "pointer-events-none scale-95 opacity-50"
        )}
        onClick={handleClick}
      >
        <div className="flex gap-3">
          {/* Icon */}
          <div
            className={cn(
              "flex-shrink-0 rounded-full p-2 transition-colors",
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
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            {/* Header */}
            <div className="mb-1 flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "truncate text-sm",
                    notification.read
                      ? "text-muted-foreground font-medium"
                      : "text-foreground font-semibold"
                  )}
                >
                  {notification.title}
                </p>
              </div>

              {/* Priority Badge */}
              {notification.priority !== "normal" && !compact && (
                <Badge
                  variant={priorityConfig.badgeVariant}
                  className="shrink-0"
                >
                  <span className="text-xs">
                    {dictionary.priorities.badge[notification.priority]}
                  </span>
                </Badge>
              )}
            </div>

            {/* Body */}
            <p
              className={cn(
                "text-muted-foreground text-sm",
                compact ? "line-clamp-1" : "line-clamp-2"
              )}
            >
              {notification.body}
            </p>

            {/* Footer */}
            <div className="mt-2 flex items-center justify-between">
              {/* Actor & Time */}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">
                  {notification.actor && (
                    <>
                      <span className="inline-block max-w-[120px] truncate align-bottom">
                        {notification.actor.username ||
                          notification.actor.email}
                      </span>
                      <span className="mx-1">•</span>
                    </>
                  )}
                  <time dateTime={notification.createdAt}>{timeAgo}</time>
                </span>
              </div>

              {/* Actions */}
              {!compact && (
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={handleMarkAsRead}
                      disabled={isPending}
                      aria-label={dictionary.accessibility.markAsReadButton}
                    >
                      {isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      <span className="sr-only">
                        {dictionary.actions.markAsRead}
                      </span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    aria-label={dictionary.accessibility.deleteButton}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    <span className="sr-only">{dictionary.actions.delete}</span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Unread Indicator */}
          {!notification.read && compact && (
            <div className="flex-shrink-0 self-center">
              <div className="bg-primary h-2 w-2 animate-pulse rounded-full" />
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

/**
 * Compact notification card for dropdown/bell
 */
export function NotificationCardCompact({
  notification,
  locale,
  dictionary,
  onRead,
  onDelete,
}: Omit<NotificationCardProps, "compact">) {
  return (
    <NotificationCard
      notification={notification}
      locale={locale}
      dictionary={dictionary}
      onRead={onRead}
      onDelete={onDelete}
      compact
    />
  )
}
