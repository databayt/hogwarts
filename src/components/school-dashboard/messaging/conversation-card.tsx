"use client"

import { format, formatDistanceToNow } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import {
  Archive,
  Building2,
  EllipsisVertical,
  Hash,
  Megaphone,
  MessageSquare,
  Pin,
  Trash2,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

export function ConversationCard({
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
  const dateLocale = locale === "ar" ? ar : enUS
  const config = CONVERSATION_TYPE_CONFIG[conversation.type]
  const Icon = config.icon

  // Get current user's participant info
  const currentParticipant = conversation.participants?.find(
    (p) => p.userId === currentUserId
  )
  const isMuted = currentParticipant?.isMuted ?? false
  const isPinned = currentParticipant?.isPinned ?? false

  // For direct conversations, get the other user's info
  const otherUser =
    conversation.type === "direct"
      ? conversation.participants?.find((p) => p.userId !== currentUserId)?.user
      : null

  // Determine display name and avatar
  const displayName =
    conversation.type === "direct" && otherUser
      ? otherUser.username || otherUser.email || locale === "ar"
        ? "مستخدم"
        : "User"
      : conversation.title || config.label

  const avatarUrl =
    conversation.type === "direct" && otherUser
      ? otherUser.image || undefined
      : conversation.avatar || undefined

  const avatarFallback = displayName?.[0]?.toUpperCase() || "C"

  // Format last message time
  const lastMessageTime = conversation.lastMessageAt
    ? formatDistanceToNow(new Date(conversation.lastMessageAt), {
        addSuffix: true,
        locale: dateLocale,
      })
    : null

  // Get last message preview
  const lastMessagePreview = conversation.lastMessage
    ? conversation.lastMessage.isDeleted
      ? locale === "ar"
        ? "تم حذف الرسالة"
        : "Message deleted"
      : conversation.lastMessage.content
    : locale === "ar"
      ? "لا توجد رسائل"
      : "No messages"

  const hasUnread = (conversation.unreadCount ?? 0) > 0

  return (
    <div
      onClick={() => onClick?.(conversation.id)}
      className={cn(
        "group relative flex items-center gap-3 px-4 py-3",
        "cursor-pointer transition-all duration-200",
        "border-border border-b",
        // iMessage-style hover and active states
        "hover:bg-accent",
        isActive && "bg-accent",
        className
      )}
    >
      {/* iMessage-style unread indicator (purple dot on left) */}
      {hasUnread && (
        <div className="absolute top-1/2 left-2 -translate-y-1/2">
          <div className="bg-chart-5 h-2 w-2 animate-pulse rounded-full" />
        </div>
      )}

      {/* Avatar */}
      <div className="relative ms-2 flex-shrink-0">
        <Avatar
          className={cn(
            "transition-all",
            hasUnread
              ? "h-12 w-12 sm:h-14 sm:w-14"
              : "h-11 w-11 sm:h-12 sm:w-12"
          )}
        >
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback className="bg-muted text-muted-foreground">
            {avatarFallback}
          </AvatarFallback>
        </Avatar>

        {/* Conversation type indicator */}
        {conversation.type !== "direct" && (
          <div
            className={cn(
              "absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full",
              "bg-background border-border border"
            )}
          >
            <Icon className="text-muted-foreground h-3 w-3" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h3
              className={cn(
                "text-foreground truncate",
                hasUnread ? "font-bold" : "font-semibold"
              )}
            >
              {displayName}
            </h3>
            {isMuted && (
              <VolumeX className="text-muted-foreground h-3.5 w-3.5 flex-shrink-0" />
            )}
          </div>

          {lastMessageTime && (
            <span
              className={cn(
                "flex-shrink-0 text-xs",
                hasUnread
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground"
              )}
            >
              {lastMessageTime}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <p
            className={cn(
              "flex-1 truncate text-sm",
              hasUnread
                ? "text-foreground font-semibold"
                : "text-muted-foreground"
            )}
          >
            {conversation.lastMessage?.senderId === currentUserId && (
              <span
                className={cn(
                  hasUnread ? "text-foreground/70" : "text-muted-foreground"
                )}
              >
                {locale === "ar" ? "أنت: " : "You: "}
              </span>
            )}
            {lastMessagePreview}
          </p>
        </div>

        {/* Participant count for group conversations */}
        {conversation.type !== "direct" &&
          conversation.participantCount > 0 && (
            <div className="mt-1 flex items-center gap-1">
              <Users className="text-muted-foreground h-3 w-3" />
              <span className="text-muted-foreground text-xs">
                {conversation.participantCount}{" "}
                {locale === "ar" ? "عضو" : "members"}
              </span>
            </div>
          )}
      </div>

      {/* Actions menu */}
      <div className="absolute top-3 right-3 opacity-0 transition-opacity group-hover:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="bg-background border-border h-8 w-8 border"
            >
              <EllipsisVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onPin?.(conversation.id)
              }}
            >
              <Pin className="me-2 h-4 w-4" />
              {isPinned
                ? locale === "ar"
                  ? "إلغاء التثبيت"
                  : "Unpin"
                : locale === "ar"
                  ? "تثبيت"
                  : "Pin"}
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
                  {locale === "ar" ? "إلغاء الكتم" : "Unmute"}
                </>
              ) : (
                <>
                  <VolumeX className="me-2 h-4 w-4" />
                  {locale === "ar" ? "كتم" : "Mute"}
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
              {locale === "ar" ? "أرشفة" : "Archive"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.(conversation.id)
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="me-2 h-4 w-4" />
              {locale === "ar" ? "حذف" : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function ConversationCardSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3">
      <div className="bg-muted h-12 w-12 animate-pulse rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="bg-muted h-4 w-32 animate-pulse rounded" />
        <div className="bg-muted h-3 w-48 animate-pulse rounded" />
      </div>
    </div>
  )
}
