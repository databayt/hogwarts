"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import {
  Check,
  CheckCheck,
  Clock,
  Copy,
  EllipsisVertical,
  Pencil,
  Reply,
  Smile,
  Trash2,
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
import { toast } from "@/components/ui/use-toast"

import type { MessageDTO } from "./types"

export interface MessageBubbleProps {
  message: MessageDTO
  currentUserId: string
  locale?: "ar" | "en"
  showSender?: boolean
  compact?: boolean
  onReply?: (message: MessageDTO) => void
  onEdit?: (message: MessageDTO) => void
  onDelete?: (messageId: string) => void
  onReact?: (messageId: string, emoji: string) => void
  onRemoveReaction?: (reactionId: string) => void
}

export interface MessageBubbleOptimizedProps extends MessageBubbleProps {
  showAvatar?: boolean
  showSenderName?: boolean
  showTimestamp?: boolean
  isFirstInGroup?: boolean
  isLastInGroup?: boolean
}

export function MessageBubble({
  message,
  currentUserId,
  locale = "en",
  showSender = true,
  compact = false,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onRemoveReaction,
  showAvatar = true,
  showSenderName = true,
  showTimestamp = true,
  isFirstInGroup = true,
  isLastInGroup = true,
}: MessageBubbleOptimizedProps) {
  const [showReactions, setShowReactions] = useState(false)
  const isOwnMessage = message.senderId === currentUserId
  const isDeleted = message.isDeleted
  const isEdited = message.isEdited && !isDeleted
  const isPending = message.status === "sending"
  const dateLocale = locale === "ar" ? ar : enUS

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      toast({ title: locale === "ar" ? "تم النسخ" : "Copied" })
    } catch (error) {
      toast({ title: locale === "ar" ? "فشل النسخ" : "Failed to copy" })
    }
  }

  const handleReactionClick = (emoji: string) => {
    const existingReaction = message.reactions.find(
      (r) => r.userId === currentUserId && r.emoji === emoji
    )

    if (existingReaction) {
      onRemoveReaction?.(existingReaction.id)
    } else {
      onReact?.(message.id, emoji)
    }
  }

  const commonEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"]

  // Group reactions by emoji
  const reactionGroups = message.reactions.reduce(
    (acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = []
      }
      acc[reaction.emoji].push(reaction)
      return acc
    },
    {} as Record<string, typeof message.reactions>
  )

  return (
    <div
      className={cn(
        "group flex w-full px-4",
        isOwnMessage ? "justify-end" : "justify-start",
        isLastInGroup ? "py-1" : "py-0.5",
        // Add smooth appear animation
        "animate-in fade-in slide-in-from-bottom-2 duration-200"
      )}
    >
      <div
        className={cn(
          "flex gap-2",
          isOwnMessage ? "flex-row-reverse" : "flex-row",
          "max-w-[65%] sm:max-w-[70%]"
        )}
      >
        {/* Avatar - only show for received messages on last message in group */}
        {!isOwnMessage && showAvatar && isLastInGroup && (
          <Avatar className="h-6 w-6 flex-shrink-0 self-end sm:h-7 sm:w-7">
            <AvatarImage
              src={message.sender.image || undefined}
              alt={message.sender.username || ""}
            />
            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
              {message.sender.username?.[0]?.toUpperCase() ||
                message.sender.email?.[0]?.toUpperCase() ||
                "U"}
            </AvatarFallback>
          </Avatar>
        )}

        {/* Spacer when no avatar to maintain alignment */}
        {!isOwnMessage && (!showAvatar || !isLastInGroup) && (
          <div className="h-6 w-6 flex-shrink-0 sm:h-7 sm:w-7" />
        )}

        <div
          className={cn(
            "flex flex-col gap-0.5",
            isOwnMessage ? "items-end" : "items-start"
          )}
        >
          {/* Sender name - only show for received messages on first message in group */}
          {!isOwnMessage && showSenderName && isFirstInGroup && (
            <span className="text-muted-foreground mb-0.5 px-3 text-xs font-semibold">
              {message.sender.username || message.sender.email}
            </span>
          )}

          {/* Reply context */}
          {message.replyTo && (
            <div
              className={cn(
                "bg-muted/50 border-primary mb-1 rounded-lg border-l-2 px-3 py-1.5 text-xs",
                "max-w-full"
              )}
            >
              <p className="text-muted-foreground mb-0.5 text-[10px] font-medium tracking-wide uppercase">
                {message.replyTo.sender.username ||
                  message.replyTo.sender.email}
              </p>
              <p className="text-muted-foreground truncate">
                {message.replyTo.isDeleted
                  ? locale === "ar"
                    ? "تم حذف الرسالة"
                    : "Message deleted"
                  : message.replyTo.content}
              </p>
            </div>
          )}

          {/* Message bubble - iMessage style with asymmetric tail */}
          <div
            className={cn(
              "relative px-3 py-2 break-words shadow-sm",
              // iMessage-style rounded corners with asymmetric tail
              isOwnMessage
                ? "bg-primary text-primary-foreground rounded-[18px] rounded-tr-[4px]"
                : "bg-muted text-foreground border-border rounded-[18px] rounded-tl-[4px] border",
              isDeleted && "italic opacity-60",
              isPending && "opacity-70" // Optimistic message (pending)
            )}
          >
            {/* Message content */}
            {isDeleted ? (
              <span className="text-muted-foreground">
                {locale === "ar"
                  ? "تم حذف هذه الرسالة"
                  : "This message was deleted"}
              </span>
            ) : (
              <>
                <p className="whitespace-pre-wrap">{message.content}</p>

                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "bg-background/10 hover:bg-background/20 flex items-center gap-2 rounded p-2 transition-colors",
                          isOwnMessage
                            ? "text-primary-foreground"
                            : "text-foreground"
                        )}
                      >
                        <span className="truncate text-sm">
                          {attachment.name}
                        </span>
                        <span className="text-xs opacity-70">
                          {attachment.size}
                        </span>
                      </a>
                    ))}
                  </div>
                )}

                {/* Timestamp and status - only on last message in group */}
                {showTimestamp && isLastInGroup && (
                  <div
                    className={cn(
                      "mt-1 flex items-center gap-1",
                      isOwnMessage ? "justify-end" : "justify-start"
                    )}
                  >
                    {isEdited && (
                      <span
                        className={cn(
                          "text-[10px]",
                          isOwnMessage
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        )}
                      >
                        {locale === "ar" ? "معدلة" : "edited"}
                      </span>
                    )}
                    <span
                      className={cn(
                        "text-[10px]",
                        isOwnMessage
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      )}
                    >
                      {format(new Date(message.createdAt), "p", {
                        locale: dateLocale,
                      })}
                    </span>
                    {isOwnMessage && (
                      <span className="text-primary-foreground/70">
                        {message.status === "sending" && (
                          <Clock className="h-3 w-3 animate-pulse" />
                        )}
                        {message.status === "sent" && (
                          <Check className="h-3 w-3" />
                        )}
                        {message.status === "delivered" && (
                          <CheckCheck className="h-3 w-3" />
                        )}
                        {message.status === "read" && (
                          <CheckCheck className="h-3 w-3" />
                        )}
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Actions menu */}
          {!isDeleted && (
            <div
              className={cn(
                "absolute top-0 opacity-0 transition-opacity group-hover:opacity-100",
                isOwnMessage ? "-left-10" : "-right-10"
              )}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-background border-border h-8 w-8 border"
                  >
                    <EllipsisVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isOwnMessage ? "end" : "start"}>
                  <DropdownMenuItem
                    onClick={() => setShowReactions(!showReactions)}
                  >
                    <Smile className="mr-2 h-4 w-4" />
                    {locale === "ar" ? "تفاعل" : "React"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onReply?.(message)}>
                    <Reply className="mr-2 h-4 w-4" />
                    {locale === "ar" ? "رد" : "Reply"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopy}>
                    <Copy className="mr-2 h-4 w-4" />
                    {locale === "ar" ? "نسخ" : "Copy"}
                  </DropdownMenuItem>
                  {isOwnMessage && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit?.(message)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {locale === "ar" ? "تعديل" : "Edit"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete?.(message.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {locale === "ar" ? "حذف" : "Delete"}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Reactions */}
        {Object.keys(reactionGroups).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {Object.entries(reactionGroups).map(([emoji, reactions]) => {
              const hasUserReacted = reactions.some(
                (r) => r.userId === currentUserId
              )
              return (
                <button
                  key={emoji}
                  onClick={() => handleReactionClick(emoji)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors",
                    hasUserReacted
                      ? "bg-primary/20 border-primary border"
                      : "bg-muted border-border hover:bg-muted/80 border"
                  )}
                >
                  <span>{emoji}</span>
                  <span className="text-muted-foreground">
                    {reactions.length}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Quick reaction picker */}
        {showReactions && !isDeleted && (
          <div className="bg-background border-border flex gap-1 rounded-lg border p-2 shadow-lg">
            {commonEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  handleReactionClick(emoji)
                  setShowReactions(false)
                }}
                className="hover:bg-muted rounded p-1 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
