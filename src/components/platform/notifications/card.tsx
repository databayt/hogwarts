"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { Check, Trash2, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { NotificationDTO } from "./types"
import { NOTIFICATION_TYPE_CONFIG, PRIORITY_CONFIG } from "./config"
import { markNotificationAsRead, deleteNotification } from "./actions"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"

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
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const config = NOTIFICATION_TYPE_CONFIG[notification.type]
  const priorityConfig = PRIORITY_CONFIG[notification.priority]
  const Icon = config.icon

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (notification.read) return

    setIsLoading(true)
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
    setIsLoading(false)
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
    }
    setIsDeleting(false)
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
    <Card
      className={cn(
        "relative cursor-pointer transition-colors hover:bg-accent/50",
        !notification.read && "bg-accent/20 border-l-4 border-l-primary",
        compact ? "p-3" : "p-4",
        isDeleting && "opacity-50 pointer-events-none"
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex-shrink-0 rounded-full p-2",
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
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <h4
                className={cn(
                  "text-sm font-medium truncate",
                  notification.read ? "text-muted-foreground" : "text-foreground"
                )}
              >
                {notification.title}
              </h4>
            </div>

            {/* Priority Badge */}
            {notification.priority !== "normal" && !compact && (
              <Badge variant={priorityConfig.badgeVariant}>
                <small>{dictionary.priorities.badge[notification.priority]}</small>
              </Badge>
            )}
          </div>

          {/* Body */}
          <p
            className={cn(
              "muted",
              compact ? "line-clamp-1" : "line-clamp-2"
            )}
          >
            {notification.body}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            {/* Actor & Time */}
            <div className="flex items-center gap-2">
              <small className="text-muted-foreground">
                {notification.actor && (
                  <>
                    <span className="truncate max-w-[120px]">
                      {notification.actor.username || notification.actor.email}
                    </span>
                    <span className="mx-1">•</span>
                  </>
                )}
                <time dateTime={notification.createdAt}>
                  {timeAgo}
                </time>
              </small>
            </div>

            {/* Actions */}
            {!compact && (
              <div className="flex items-center gap-1">
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={handleMarkAsRead}
                    disabled={isLoading}
                    aria-label={dictionary.accessibility.markAsReadButton}
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span className="sr-only">{dictionary.actions.markAsRead}</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-destructive hover:text-destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  aria-label={dictionary.accessibility.deleteButton}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">{dictionary.actions.delete}</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Unread Indicator */}
        {!notification.read && compact && (
          <div className="flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-primary" />
          </div>
        )}
      </div>
    </Card>
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
