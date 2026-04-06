"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { memo } from "react"
import {
  differenceInCalendarDays,
  format,
  isToday,
  isYesterday,
} from "date-fns"
import { ar, enUS } from "date-fns/locale"
import {
  Archive,
  Check,
  CheckCheck,
  ChevronDown,
  Pin,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { CONVERSATION_TYPE_CONFIG } from "./config"
import type { ConversationDTO } from "./types"

export interface ConversationCardProps {
  conversation: ConversationDTO
  currentUserId: string
  locale?: "ar" | "en"
  isActive?: boolean
  onClick?: (conversationId: string) => void
  onArchive?: (conversationId: string) => void
  onDelete?: (conversationId: string) => void
  onPin?: (conversationId: string) => void
  onMute?: (conversationId: string) => void
  className?: string
}

/**
 * WhatsApp-style short time format:
 * - Today: "2:30 PM"
 * - Yesterday: "Yesterday"
 * - This week (< 7 days): Day name ("Tuesday")
 * - Older: Short date ("12/15/2025")
 */
function formatConversationTime(
  date: Date | string,
  locale: "ar" | "en",
  _yesterday = "Yesterday"
): string {
  const d = new Date(date)
  const dateLocale = locale === "ar" ? ar : enUS

  if (isToday(d)) {
    return format(d, "p", { locale: dateLocale })
  }
  if (isYesterday(d)) {
    return _yesterday
  }
  if (differenceInCalendarDays(new Date(), d) < 7) {
    return format(d, "EEEE", { locale: dateLocale })
  }
  return format(d, "P", { locale: dateLocale })
}

export const ConversationCard = memo(function ConversationCard({
  conversation,
  currentUserId,
  locale = "en",
  isActive = false,
  onClick,
  onArchive,
  onDelete,
  onPin,
  onMute,
  className,
}: ConversationCardProps) {
  const { dictionary } = useDictionary()
  const m = dictionary?.messaging

  // Current user's participant info
  const currentParticipant = conversation.participants?.find(
    (p) => p.userId === currentUserId
  )
  const isMuted = currentParticipant?.isMuted ?? false
  const isPinned = currentParticipant?.isPinned ?? false

  // For direct conversations, get the other user
  const otherUser =
    conversation.type === "direct"
      ? conversation.participants?.find((p) => p.userId !== currentUserId)?.user
      : null

  const displayName =
    conversation.type === "direct" && otherUser
      ? otherUser.username || otherUser.email || m?.ui?.user_fallback || "User"
      : conversation.title || CONVERSATION_TYPE_CONFIG[conversation.type].label

  const avatarUrl =
    conversation.type === "direct" && otherUser
      ? otherUser.image || undefined
      : conversation.avatar || undefined

  const avatarFallback = displayName?.[0]?.toUpperCase() || "C"

  // WhatsApp-style short time
  const lastMessageTime = conversation.lastMessageAt
    ? formatConversationTime(
        conversation.lastMessageAt,
        locale,
        m?.ui?.yesterday || "Yesterday"
      )
    : null

  // Last message preview
  const lastMessagePreview = conversation.lastMessage
    ? conversation.lastMessage.isDeleted
      ? m?.ui?.message_deleted || "Message deleted"
      : conversation.lastMessage.content
    : m?.ui?.no_messages || "No messages"

  const hasUnread = (conversation.unreadCount ?? 0) > 0
  const isOwnLastMessage = conversation.lastMessage?.senderId === currentUserId

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(conversation.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick?.(conversation.id)
        }
      }}
      className={cn(
        "group relative flex h-[72px] cursor-pointer items-center gap-3 px-3 transition-colors",
        "hover:bg-msg-hover",
        isActive && "bg-msg-hover",
        className
      )}
    >
      {/* Avatar — 49px circle */}
      <Avatar className="h-[49px] w-[49px] flex-shrink-0">
        <AvatarImage src={avatarUrl} alt={displayName} />
        <AvatarFallback className="bg-muted text-muted-foreground">
          {avatarFallback}
        </AvatarFallback>
      </Avatar>

      {/* Content — inset bottom border (starts at text, not avatar) */}
      <div className="border-border flex min-w-0 flex-1 flex-col justify-center border-b py-3">
        {/* Row 1: Name + Time */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "text-foreground truncate text-[15px]",
              hasUnread ? "font-medium" : "font-normal"
            )}
          >
            {displayName}
          </span>
          {lastMessageTime && (
            <span
              className={cn(
                "flex-shrink-0 text-xs",
                hasUnread
                  ? "text-msg-unread-badge font-medium"
                  : "text-muted-foreground"
              )}
            >
              {lastMessageTime}
            </span>
          )}
        </div>

        {/* Row 2: Last message preview + badges */}
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="text-muted-foreground flex min-w-0 flex-1 items-center gap-1 truncate text-sm">
            {/* Delivery status for own messages */}
            {isOwnLastMessage && conversation.lastMessage && (
              <span className="flex-shrink-0">
                {conversation.lastMessage.status === "read" ? (
                  <CheckCheck className="text-msg-read-check h-4 w-4" />
                ) : conversation.lastMessage.status === "delivered" ? (
                  <CheckCheck className="text-muted-foreground h-4 w-4" />
                ) : (
                  <Check className="text-muted-foreground h-4 w-4" />
                )}
              </span>
            )}
            <span className="truncate">{lastMessagePreview}</span>
          </p>

          {/* Right badges */}
          <div className="flex flex-shrink-0 items-center gap-1.5">
            {conversation.whatsappEnabled && (
              <span className="text-[10px] font-bold text-green-600">W</span>
            )}
            {isPinned && <Pin className="text-muted-foreground h-3.5 w-3.5" />}
            {isMuted && (
              <VolumeX className="text-muted-foreground h-3.5 w-3.5" />
            )}
            {hasUnread && (
              <span className="bg-msg-unread-badge flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white">
                {(conversation.unreadCount ?? 0) > 99
                  ? "99+"
                  : conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hover dropdown — WhatsApp chevron */}
      <div className="absolute end-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button className="bg-msg-sidebar-bg flex h-6 w-6 items-center justify-center rounded-full shadow-sm">
              <ChevronDown className="text-muted-foreground h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onPin?.(conversation.id)
              }}
            >
              <Pin className="me-2 h-4 w-4" />
              {isPinned
                ? m?.actions?.unpin || "Unpin"
                : m?.actions?.pin || "Pin"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onMute?.(conversation.id)
              }}
            >
              {isMuted ? (
                <>
                  <Volume2 className="me-2 h-4 w-4" />
                  {m?.actions?.unmute || "Unmute"}
                </>
              ) : (
                <>
                  <VolumeX className="me-2 h-4 w-4" />
                  {m?.actions?.mute || "Mute"}
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onArchive?.(conversation.id)
              }}
            >
              <Archive className="me-2 h-4 w-4" />
              {m?.actions?.archive || "Archive"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.(conversation.id)
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="me-2 h-4 w-4" />
              {m?.actions?.delete || "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
})

export function ConversationCardSkeleton() {
  return (
    <div className="flex h-[72px] items-center gap-3 px-3">
      <Skeleton className="h-[49px] w-[49px] rounded-full" />
      <div className="border-border flex-1 space-y-2 border-b py-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-3 w-12 rounded" />
        </div>
        <Skeleton className="h-3 w-44 rounded" />
      </div>
    </div>
  )
}
