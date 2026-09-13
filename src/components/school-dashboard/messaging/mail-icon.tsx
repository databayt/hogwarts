"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Mail } from "lucide-react"
import { useSession } from "next-auth/react"

import { cn } from "@/lib/utils"
import socketService from "@/lib/websocket/socket-service"
import { Button } from "@/components/ui/button"
import { CountBadge } from "@/components/atom/count-badge"

interface MessageMailIconProps {
  messagesUrl: string
  label?: string
  className?: string
  /** Size of the mail glyph itself, e.g. `size-6` on the phone menu's row. */
  iconClassName?: string
}

export function MessageMailIcon({
  messagesUrl,
  label = "Messages",
  className,
  iconClassName,
}: MessageMailIconProps) {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const [unreadCount, setUnreadCount] = useState(0)
  // Set on hover / touch / focus: the moment the link's prefetch is wanted.
  const [intent, setIntent] = useState(false)

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
      {/* Prefetch on intent, not on sight. This icon is in the header of every
          dashboard page, and /messages lives in its own route group with its
          own dictionary provider — so the automatic viewport prefetch pulled
          that layout's whole dictionary, 684 KB, on every dashboard open. A
          hover or a touch is the signal that the prefetch is worth it. */}
      <Link
        href={messagesUrl}
        prefetch={intent ? null : false}
        onMouseEnter={() => setIntent(true)}
        onTouchStart={() => setIntent(true)}
        onFocus={() => setIntent(true)}
      >
        <span className="relative">
          <Mail className={cn("size-4", iconClassName)} />
          <CountBadge count={unreadCount} />
        </span>
        <span className="sr-only">{label}</span>
      </Link>
    </Button>
  )
}
