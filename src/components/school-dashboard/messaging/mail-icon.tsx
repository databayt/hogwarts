"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { Mail } from "lucide-react"
import { useSession } from "next-auth/react"

import { cn } from "@/lib/utils"
import socketService from "@/lib/websocket/socket-service"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface MessageMailIconProps {
  messagesUrl: string
  label?: string
  className?: string
}

export function MessageMailIcon({
  messagesUrl,
  label = "Messages",
  className,
}: MessageMailIconProps) {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/unread-count")
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.count ?? 0)
      }
    } catch {
      // Silently fail — badge just won't show
    }
  }, [])

  // Fetch on mount
  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  // Socket-based instant update — increment on new message from others
  useEffect(() => {
    if (!userId) return
    const unsub = socketService.on("message:new", (data) => {
      if (data.senderId !== userId) {
        setUnreadCount((prev) => prev + 1)
      }
    })
    return unsub
  }, [userId])

  // Re-sync on tab focus to correct any drift
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchUnreadCount()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [fetchUnreadCount])

  return (
    <Button
      variant="link"
      size="icon"
      className={cn(
        "relative size-7 cursor-pointer transition-opacity hover:opacity-70",
        className
      )}
      asChild
    >
      <Link href={messagesUrl}>
        <Mail className="h-4 w-4" />
        <span className="sr-only">{label}</span>

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
                className="flex h-4 min-w-4 items-center justify-center px-0.5 text-[10px] font-semibold"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </Link>
    </Button>
  )
}
