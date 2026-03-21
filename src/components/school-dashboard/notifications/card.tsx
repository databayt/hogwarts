"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { differenceInDays, format, formatDistanceToNow } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { motion } from "framer-motion"
import { Check, Loader2, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { deleteNotification, markNotificationAsRead } from "./actions"
import { NOTIFICATION_TYPE_CONFIG } from "./config"
import type { NotificationDTO } from "./types"

interface NotificationCardProps {
  notification: NotificationDTO
  locale?: "ar" | "en"
  dictionary: Dictionary["notifications"]
  onRead?: (notificationId: string) => void
  onDelete?: (notificationId: string) => void
  compact?: boolean
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
    } else {
      toast({
        title: dictionary.errors.deleteFailed,
        description: result.error,
      })
      setIsDeleting(false)
    }
  }

  const handleClick = () => {
    if (!notification.read) {
      handleMarkAsRead({} as React.MouseEvent)
    }

    if (notification.metadata && typeof notification.metadata === "object") {
      const metadata = notification.metadata as Record<string, unknown>
      if (metadata.url && typeof metadata.url === "string") {
        router.push(metadata.url)
      }
    }
  }

  const formattedDate = formatNotificationDate(notification.createdAt, locale)

  // Actor display name
  const actorName =
    notification.actor?.username || notification.actor?.email || ""

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
          "group relative flex cursor-pointer gap-3 border-b transition-colors",
          compact ? "px-3 py-2.5" : "px-4 py-3",
          !notification.read ? "bg-accent/30" : "hover:bg-accent/50",
          isDeleting && "pointer-events-none opacity-50"
        )}
        onClick={handleClick}
        role="article"
        aria-label={`${
          notification.read
            ? dictionary.accessibility.readNotification
            : dictionary.accessibility.unreadNotification
        }: ${notification.title}`}
      >
        {/* Avatar / Icon */}
        <div className="relative flex-shrink-0">
          {notification.actor?.image ? (
            <Avatar className={compact ? "h-10 w-10" : "h-12 w-12"}>
              <AvatarImage src={notification.actor.image} alt={actorName} />
              <AvatarFallback className="bg-muted">
                <Icon className="text-muted-foreground h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          ) : (
            <div
              className={cn(
                "flex items-center justify-center rounded-full",
                compact ? "h-10 w-10" : "h-12 w-12",
                notification.priority === "urgent"
                  ? "bg-destructive/10"
                  : "bg-muted"
              )}
            >
              <Icon
                className={cn(
                  compact ? "h-4 w-4" : "h-5 w-5",
                  notification.priority === "urgent"
                    ? "text-destructive"
                    : "text-muted-foreground"
                )}
              />
            </div>
          )}

          {/* Unread dot on avatar */}
          {!notification.read && (
            <span className="bg-primary absolute -top-0.5 block h-2.5 w-2.5 rounded-full ring-2 ring-white ltr:-right-0.5 rtl:-left-0.5 dark:ring-gray-950" />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm",
              compact ? "line-clamp-2" : "line-clamp-3",
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

          <time
            dateTime={notification.createdAt}
            className="text-muted-foreground mt-0.5 block text-xs"
          >
            {formattedDate}
          </time>
        </div>

        {/* Dismiss button - always visible like Airbnb */}
        <div className="flex flex-shrink-0 items-start gap-1 pt-0.5">
          {/* Mark as read (full mode only, on hover) */}
          {!compact && !notification.read && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={handleMarkAsRead}
              disabled={isPending}
              aria-label={dictionary.accessibility.markAsReadButton}
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </Button>
          )}

          {/* X dismiss - always visible */}
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground h-7 w-7"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label={dictionary.accessibility.deleteButton}
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
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
