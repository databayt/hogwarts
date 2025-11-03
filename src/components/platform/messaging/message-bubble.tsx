"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { Check, CheckCheck, MoreVertical, Reply, Smile, Pencil, Trash2, Copy } from "lucide-react"
import type { MessageDTO } from "./types"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"

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
}: MessageBubbleProps) {
  const [showReactions, setShowReactions] = useState(false)
  const isOwnMessage = message.senderId === currentUserId
  const isDeleted = message.isDeleted
  const isEdited = message.isEdited && !isDeleted
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
  const reactionGroups = message.reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = []
    }
    acc[reaction.emoji].push(reaction)
    return acc
  }, {} as Record<string, typeof message.reactions>)

  return (
    <div
      className={cn(
        "group flex gap-3 mb-4",
        isOwnMessage ? "flex-row-reverse" : "flex-row",
        compact && "mb-2"
      )}
    >
      {/* Avatar */}
      {showSender && !compact && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={message.sender.image || undefined} alt={message.sender.username || ""} />
          <AvatarFallback className="bg-muted text-muted-foreground">
            {message.sender.username?.[0]?.toUpperCase() || message.sender.email?.[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn("flex flex-col gap-1 max-w-[70%]", isOwnMessage ? "items-end" : "items-start")}>
        {/* Sender name and timestamp */}
        {showSender && !compact && (
          <div className={cn("flex items-center gap-2 text-sm", isOwnMessage && "flex-row-reverse")}>
            <span className="font-medium text-foreground">
              {message.sender.username || message.sender.email}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(message.createdAt), "p", { locale: dateLocale })}
            </span>
          </div>
        )}

        {/* Reply context */}
        {message.replyTo && (
          <div
            className={cn(
              "text-xs p-2 rounded bg-muted/50 border-l-2 border-primary mb-1",
              isOwnMessage ? "self-end" : "self-start"
            )}
          >
            <p className="font-medium text-muted-foreground">
              {message.replyTo.sender.username || message.replyTo.sender.email}
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

        {/* Message bubble */}
        <div
          className={cn(
            "relative px-4 py-2 rounded-2xl break-words",
            isOwnMessage
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground",
            isDeleted && "opacity-60 italic",
            compact ? "px-3 py-1.5 text-sm" : ""
          )}
        >
          {/* Message content */}
          {isDeleted ? (
            <span className="text-muted-foreground">
              {locale === "ar" ? "تم حذف هذه الرسالة" : "This message was deleted"}
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
                        "flex items-center gap-2 p-2 rounded bg-background/10 hover:bg-background/20 transition-colors",
                        isOwnMessage ? "text-primary-foreground" : "text-foreground"
                      )}
                    >
                      <span className="text-sm truncate">{attachment.name}</span>
                      <span className="text-xs opacity-70">{attachment.size}</span>
                    </a>
                  ))}
                </div>
              )}

              {/* Message status indicators */}
              <div className="flex items-center gap-1 mt-1 justify-end">
                {isEdited && (
                  <span className="text-xs opacity-70">
                    {locale === "ar" ? "معدلة" : "edited"}
                  </span>
                )}
                {isOwnMessage && (
                  <span className="text-xs opacity-70">
                    {message.status === "sent" && <Check className="h-3 w-3" />}
                    {message.status === "delivered" && <CheckCheck className="h-3 w-3" />}
                    {message.status === "read" && <CheckCheck className="h-3 w-3 text-primary-foreground" />}
                  </span>
                )}
                {compact && (
                  <span className="text-xs opacity-70">
                    {format(new Date(message.createdAt), "p", { locale: dateLocale })}
                  </span>
                )}
              </div>
            </>
          )}

          {/* Actions menu */}
          {!isDeleted && (
            <div
              className={cn(
                "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity",
                isOwnMessage ? "-left-10" : "-right-10"
              )}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-background border border-border"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isOwnMessage ? "end" : "start"}>
                  <DropdownMenuItem onClick={() => setShowReactions(!showReactions)}>
                    <Smile className="h-4 w-4 mr-2" />
                    {locale === "ar" ? "تفاعل" : "React"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onReply?.(message)}>
                    <Reply className="h-4 w-4 mr-2" />
                    {locale === "ar" ? "رد" : "Reply"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopy}>
                    <Copy className="h-4 w-4 mr-2" />
                    {locale === "ar" ? "نسخ" : "Copy"}
                  </DropdownMenuItem>
                  {isOwnMessage && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit?.(message)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        {locale === "ar" ? "تعديل" : "Edit"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete?.(message.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
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
              const hasUserReacted = reactions.some((r) => r.userId === currentUserId)
              return (
                <button
                  key={emoji}
                  onClick={() => handleReactionClick(emoji)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors",
                    hasUserReacted
                      ? "bg-primary/20 border border-primary"
                      : "bg-muted border border-border hover:bg-muted/80"
                  )}
                >
                  <span>{emoji}</span>
                  <span className="text-muted-foreground">{reactions.length}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Quick reaction picker */}
        {showReactions && !isDeleted && (
          <div className="flex gap-1 p-2 bg-background border border-border rounded-lg shadow-lg">
            {commonEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  handleReactionClick(emoji)
                  setShowReactions(false)
                }}
                className="p-1 hover:bg-muted rounded transition-colors"
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
