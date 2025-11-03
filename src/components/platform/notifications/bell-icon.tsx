"use client"

import { useState, useRef, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useNotificationBell } from "./use-notifications"
import { NotificationListScrollable } from "./list"
import { useRouter } from "next/navigation"

interface NotificationBellIconProps {
  locale?: "ar" | "en"
  className?: string
  showConnectionStatus?: boolean
}

export function NotificationBellIcon({
  locale = "en",
  className,
  showConnectionStatus = false,
}: NotificationBellIconProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const {
    isConnected,
    unreadCount,
    recentNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationBell()

  const handleNotificationRead = (notificationId: string) => {
    markAsRead(notificationId)
  }

  const handleNotificationDelete = (notificationId: string) => {
    // Optimistic update handled by the hook
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
    setIsOpen(false)
  }

  // Close popover when clicking outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      // Check if click is outside popover
      if (!target.closest("[data-notification-bell]")) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  return (
    <div
      className={cn("relative", className)}
      data-notification-bell
    >
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
          >
            <Bell className="h-5 w-5" />

            {/* Unread count badge */}
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}

            {/* Connection status indicator */}
            {showConnectionStatus && (
              <span
                className={cn(
                  "absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-background",
                  isConnected ? "bg-green-500" : "bg-muted-foreground"
                )}
                aria-label={isConnected ? "Connected" : "Disconnected"}
              />
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[400px] p-0"
          align="end"
          sideOffset={8}
        >
          <NotificationListScrollable
            notifications={recentNotifications}
            locale={locale}
            onRead={handleNotificationRead}
            onDelete={handleNotificationDelete}
            onMarkAllRead={unreadCount > 0 ? handleMarkAllAsRead : undefined}
            maxHeight={500}
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
  className,
}: Omit<NotificationBellIconProps, "showConnectionStatus">) {
  const router = useRouter()
  const { unreadCount } = useNotificationBell()

  const handleClick = () => {
    router.push(`/${locale}/notifications`)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("relative", className)}
      onClick={handleClick}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
    >
      <Bell className="h-5 w-5" />

      {/* Unread count badge */}
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
    </Button>
  )
}
