"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CountBadge } from "@/components/atom/count-badge"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { NotificationListScrollable } from "./list"
import { useNotificationBell } from "./use-notifications"

interface NotificationBellIconProps {
  locale?: "ar" | "en"
  dictionary: Dictionary["notifications"]
  className?: string
  /** Size of the bell glyph itself, e.g. `size-6` on the phone menu's row. */
  iconClassName?: string
  showConnectionStatus?: boolean
  /**
   * Footer link destination. Pass `null` on a surface with no notification
   * center — the SaaS dashboard is on the main host, which has no
   * `/notifications` route.
   */
  viewAllHref?: string | null
}

export function NotificationBellIcon({
  locale = "en",
  dictionary,
  className,
  iconClassName,
  showConnectionStatus = false,
  viewAllHref,
}: NotificationBellIconProps) {
  const [isOpen, setIsOpen] = useState(false)
  const {
    isConnected,
    unreadCount,
    recentNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotificationBell(locale)

  const handleNotificationRead = useCallback(
    (notificationId: string) => {
      markAsRead(notificationId)
    },
    [markAsRead]
  )

  const handleNotificationDelete = useCallback(
    (notificationId: string) => {
      removeNotification(notificationId)
    },
    [removeNotification]
  )

  const handleMarkAllAsRead = useCallback(async () => {
    await markAllAsRead()
    setIsOpen(false)
  }, [markAllAsRead])

  return (
    <div className={cn("relative", className)} data-notification-bell>
      {/* Live region for screen reader announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {unreadCount > 0 &&
          dictionary.accessibility.unreadCount.replace(
            "{{count}}",
            unreadCount.toString()
          )}
      </div>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative transition-transform hover:scale-105 active:scale-95"
            aria-label={
              unreadCount > 0
                ? dictionary.accessibility.unreadCount.replace(
                    "{{count}}",
                    unreadCount.toString()
                  )
                : dictionary.accessibility.notificationsBell
            }
            aria-haspopup="dialog"
            aria-expanded={isOpen}
          >
            <span className="relative">
              <Bell className={cn("size-4", iconClassName)} />
              <CountBadge count={unreadCount} />
            </span>

            {/* Connection status indicator */}
            {showConnectionStatus && (
              <span
                className={cn(
                  "border-background absolute bottom-0 h-2 w-2 rounded-full border-2 transition-colors ltr:right-0 rtl:left-0",
                  isConnected
                    ? "bg-emerald-500"
                    : "bg-muted-foreground animate-pulse"
                )}
                aria-label={
                  isConnected
                    ? dictionary.accessibility.connected
                    : dictionary.accessibility.disconnected
                }
              />
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[380px] overflow-hidden p-0 sm:w-[420px]"
          align="end"
          sideOffset={8}
          dir={locale === "ar" ? "rtl" : "ltr"}
        >
          <NotificationListScrollable
            notifications={recentNotifications}
            locale={locale}
            dictionary={dictionary}
            onRead={handleNotificationRead}
            onDelete={handleNotificationDelete}
            onMarkAllRead={unreadCount > 0 ? handleMarkAllAsRead : undefined}
            maxHeight={450}
            viewAllHref={viewAllHref}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

/**
 * Compact bell icon for mobile/small screens
 */
export function NotificationBellIconCompact({
  locale = "en",
  dictionary,
  className,
  iconClassName,
}: Omit<NotificationBellIconProps, "showConnectionStatus">) {
  const router = useRouter()
  const { unreadCount } = useNotificationBell(locale)

  const handleClick = useCallback(() => {
    router.push(`/${locale}/notifications`)
  }, [router, locale])

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "relative transition-transform hover:scale-105 active:scale-95",
        className
      )}
      onClick={handleClick}
      aria-label={
        unreadCount > 0
          ? dictionary.accessibility.unreadCount.replace(
              "{{count}}",
              unreadCount.toString()
            )
          : dictionary.accessibility.notificationsBell
      }
    >
      <span className="relative">
        <Bell className={cn("size-4", iconClassName)} />
        <CountBadge count={unreadCount} />
      </span>
    </Button>
  )
}
