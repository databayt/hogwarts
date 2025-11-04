"use client"

import { format, formatDistanceToNow } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { Hash, MessageSquare, Users, Building2, Megaphone, MoreVertical, Archive, Trash2, Pin, Volume2, VolumeX } from "lucide-react"
import type { ConversationDTO } from "./types"
import { CONVERSATION_TYPE_CONFIG } from "./config"
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
  const currentParticipant = conversation.participants?.find(p => p.userId === currentUserId)
  const isMuted = currentParticipant?.isMuted ?? false
  const isPinned = currentParticipant?.isPinned ?? false

  // For direct conversations, get the other user's info
  const otherUser = conversation.type === "direct"
    ? conversation.participants?.find(p => p.userId !== currentUserId)?.user
    : null

  // Determine display name and avatar
  const displayName = conversation.type === "direct" && otherUser
    ? otherUser.username || otherUser.email || locale === "ar" ? "مستخدم" : "User"
    : conversation.title || config.label

  const avatarUrl = conversation.type === "direct" && otherUser
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
        "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent/50 group relative",
        isActive && "bg-accent",
        hasUnread && "bg-accent/20",
        isPinned && "border-l-2 border-l-primary",
        className
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback className="bg-muted text-muted-foreground">
            {avatarFallback}
          </AvatarFallback>
        </Avatar>

        {/* Conversation type indicator */}
        {conversation.type !== "direct" && (
          <div className={cn(
            "absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center",
            "bg-background border border-border"
          )}>
            <Icon className="h-3 w-3 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <h3 className={cn(
              "font-medium truncate",
              hasUnread ? "text-foreground" : "text-foreground"
            )}>
              {displayName}
            </h3>
            {isMuted && (
              <VolumeX className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            )}
          </div>

          {lastMessageTime && (
            <span className={cn(
              "text-xs flex-shrink-0",
              hasUnread ? "text-primary font-medium" : "text-muted-foreground"
            )}>
              {lastMessageTime}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className={cn(
            "text-sm truncate",
            hasUnread ? "font-medium text-foreground" : "text-muted-foreground"
          )}>
            {conversation.lastMessage?.senderId === currentUserId && (
              <span className="text-muted-foreground">
                {locale === "ar" ? "أنت: " : "You: "}
              </span>
            )}
            {lastMessagePreview}
          </p>

          {hasUnread && (
            <Badge variant="default" className="flex-shrink-0 h-5 min-w-[20px] px-1.5">
              {conversation.unreadCount! > 99 ? "99+" : conversation.unreadCount}
            </Badge>
          )}
        </div>

        {/* Participant count for group conversations */}
        {conversation.type !== "direct" && conversation.participantCount > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {conversation.participantCount} {locale === "ar" ? "عضو" : "members"}
            </span>
          </div>
        )}
      </div>

      {/* Actions menu */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-background border border-border"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPin?.(conversation.id) }}>
              <Pin className="h-4 w-4 mr-2" />
              {isPinned
                ? locale === "ar" ? "إلغاء التثبيت" : "Unpin"
                : locale === "ar" ? "تثبيت" : "Pin"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMute?.(conversation.id) }}>
              {isMuted ? (
                <>
                  <Volume2 className="h-4 w-4 mr-2" />
                  {locale === "ar" ? "إلغاء الكتم" : "Unmute"}
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4 mr-2" />
                  {locale === "ar" ? "كتم" : "Mute"}
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive?.(conversation.id) }}>
              <Archive className="h-4 w-4 mr-2" />
              {locale === "ar" ? "أرشفة" : "Archive"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onDelete?.(conversation.id) }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
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
      <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        <div className="h-3 w-48 bg-muted animate-pulse rounded" />
      </div>
    </div>
  )
}
