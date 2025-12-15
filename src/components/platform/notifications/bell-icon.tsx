"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { Bell } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { NotificationListScrollable } from "./list"
import { useNotificationBell } from "./use-notifications"

interface NotificationBellIconProps {
  locale?: "ar" | "en"
  dictionary: Dictionary["notifications"]
  className?: string
  showConnectionStatus?: boolean
}

export function NotificationBellIcon({
  locale = "en",
  dictionary,
  className,
  showConnectionStatus = false,
}: NotificationBellIconProps) {
  const [isOpen, setIsOpen] = useState(false)
  const {
    isConnected,
    unreadCount,
    recentNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationBell()

  const handleNotificationRead = useCallback(
    (notificationId: string) => {
      markAsRead(notificationId)
    },
    [markAsRead]
  )

  const handleNotificationDelete = useCallback(() => {
    // Optimistic update handled by the hook
  }, [])

  const handleMarkAllAsRead = useCallback(async () => {
    await markAllAsRead()
    setIsOpen(false)
  }, [markAllAsRead])

  return (
    <div className={cn("relative", className)} data-notification-bell>
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
            <Bell className="h-5 w-5" />

            {/* Unread count badge with animation */}
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute -top-1 ltr:-right-1 rtl:-left-1"
                >
                  <Badge
                    variant="destructive"
                    className="flex h-5 min-w-5 items-center justify-center px-1 text-xs font-semibold"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>

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
        >
          <NotificationListScrollable
            notifications={recentNotifications}
            locale={locale}
            dictionary={dictionary}
            onRead={handleNotificationRead}
            onDelete={handleNotificationDelete}
            onMarkAllRead={unreadCount > 0 ? handleMarkAllAsRead : undefined}
            maxHeight={450}
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
}: Omit<NotificationBellIconProps, "showConnectionStatus">) {
  const router = useRouter()
  const { unreadCount } = useNotificationBell()

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
      <Bell className="h-5 w-5" />

      {/* Unread count badge with animation */}
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute -top-1 ltr:-right-1 rtl:-left-1"
          >
            <Badge
              variant="destructive"
              className="flex h-5 min-w-5 items-center justify-center px-1 text-xs font-semibold"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  )
}
