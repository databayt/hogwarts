"use client"

import { useState, useCallback } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useNotificationBell } from "./use-notifications"
import { NotificationListScrollable } from "./list"
import { useRouter } from "next/navigation"
import type { Dictionary } from "@/components/internationalization/dictionaries"

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

  const handleNotificationRead = useCallback((notificationId: string) => {
    markAsRead(notificationId)
  }, [markAsRead])

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
                    className="h-5 min-w-5 px-1 flex items-center justify-center text-xs font-semibold"
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
                  "absolute bottom-0 ltr:right-0 rtl:left-0 h-2 w-2 rounded-full border-2 border-background transition-colors",
                  isConnected ? "bg-emerald-500" : "bg-muted-foreground animate-pulse"
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
          className="w-[380px] sm:w-[420px] p-0 overflow-hidden"
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
      className={cn("relative transition-transform hover:scale-105 active:scale-95", className)}
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
              className="h-5 min-w-5 px-1 flex items-center justify-center text-xs font-semibold"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  )
}
