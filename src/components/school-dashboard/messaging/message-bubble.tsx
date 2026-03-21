"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { memo, useState } from "react"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import {
  Check,
  CheckCheck,
  ChevronDown,
  Clock,
  Copy,
  Pencil,
  Reply,
  Smile,
  Trash2,
} from "lucide-react"

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
import { toast } from "@/components/ui/use-toast"
import { useDictionary } from "@/components/internationalization/use-dictionary"

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
  showTail?: boolean
  isFirstInGroup?: boolean
  isLastInGroup?: boolean
}

// Deterministic color for sender names in group chats
const SENDER_NAME_COLORS = [
  "text-emerald-600 dark:text-emerald-400",
  "text-sky-600 dark:text-sky-400",
  "text-violet-600 dark:text-violet-400",
  "text-rose-600 dark:text-rose-400",
  "text-amber-600 dark:text-amber-400",
  "text-teal-600 dark:text-teal-400",
  "text-indigo-600 dark:text-indigo-400",
  "text-pink-600 dark:text-pink-400",
]

function getSenderColor(senderId: string): string {
  let hash = 0
  for (let i = 0; i < senderId.length; i++) {
    hash = senderId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return SENDER_NAME_COLORS[Math.abs(hash) % SENDER_NAME_COLORS.length]
}

// Read receipt indicator (WhatsApp style)
function ReadReceiptIcon({ status }: { status: string }) {
  switch (status) {
    case "sending":
      return <Clock className="h-3.5 w-3.5 animate-pulse text-current" />
    case "sent":
      return <Check className="h-3.5 w-3.5 text-current" />
    case "delivered":
      return <CheckCheck className="h-3.5 w-3.5 text-current" />
    case "read":
      return <CheckCheck className="text-msg-read-check h-3.5 w-3.5" />
    case "failed":
      return <span className="text-destructive text-[10px]">!</span>
    default:
      return null
  }
}

const commonEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"]

export const MessageBubble = memo(function MessageBubble({
  message,
  currentUserId,
  locale = "en",
  onReply,
  onEdit,
  onDelete,
  onReact,
  onRemoveReaction,
  showAvatar = false,
  showSenderName = true,
  showTimestamp = true,
  showTail = true,
  isFirstInGroup = true,
  isLastInGroup = true,
}: MessageBubbleOptimizedProps) {
  const { dictionary } = useDictionary()
  const m = dictionary?.messaging
  const [showReactions, setShowReactions] = useState(false)
  const isOwnMessage = message.senderId === currentUserId
  const isDeleted = message.isDeleted
  const isEdited = message.isEdited && !isDeleted
  const isPending = message.status === "sending"
  const dateLocale = locale === "ar" ? ar : enUS

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      toast({ title: m?.ui?.copied || "Copied" })
    } catch {
      toast({ title: m?.ui?.copy_failed || "Failed to copy" })
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

  const hasReactions = Object.keys(reactionGroups).length > 0

  return (
    <div
      className={cn(
        "group flex w-full px-4",
        isOwnMessage ? "justify-end" : "justify-start",
        isLastInGroup ? "pb-[3px]" : "pb-[1px]"
      )}
    >
      <div
        className={cn(
          "flex gap-1.5",
          isOwnMessage ? "flex-row-reverse" : "flex-row",
          "max-w-[65%] md:max-w-[60%]"
        )}
      >
        {/* Avatar — only for received messages in groups, on first message */}
        {!isOwnMessage && showAvatar && isFirstInGroup && (
          <Avatar className="h-7 w-7 flex-shrink-0 self-start">
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
        {!isOwnMessage && showAvatar && !isFirstInGroup && (
          <div className="h-7 w-7 flex-shrink-0" />
        )}

        <div
          className={cn(
            "flex flex-col",
            isOwnMessage ? "items-end" : "items-start"
          )}
        >
          {/* Sender name — group chats, first message in group */}
          {!isOwnMessage && showSenderName && isFirstInGroup && (
            <span
              className={cn(
                "mb-0.5 px-2 text-xs font-medium",
                getSenderColor(message.senderId)
              )}
            >
              {message.sender.username || message.sender.email}
            </span>
          )}

          {/* Reply context */}
          {message.replyTo && (
            <div
              className={cn(
                "mb-0.5 max-w-full rounded-lg border-s-2 px-2.5 py-1 text-xs",
                isOwnMessage
                  ? "border-msg-incoming/60 bg-msg-outgoing/80"
                  : "border-msg-unread-badge bg-msg-incoming/80"
              )}
            >
              <p
                className={cn(
                  "mb-0.5 text-[10px] font-medium",
                  getSenderColor(message.replyTo.senderId)
                )}
              >
                {message.replyTo.sender.username ||
                  message.replyTo.sender.email}
              </p>
              <p className="text-muted-foreground truncate">
                {message.replyTo.isDeleted
                  ? m?.ui?.message_deleted || "Message deleted"
                  : message.replyTo.content}
              </p>
            </div>
          )}

          {/* Message bubble — WhatsApp style */}
          <div className="group/bubble relative">
            <div
              className={cn(
                "relative rounded-lg px-2 py-1.5 break-words shadow-sm",
                isOwnMessage
                  ? "bg-msg-outgoing text-foreground rounded-se-sm"
                  : "bg-msg-incoming text-foreground rounded-ss-sm",
                showTail &&
                  isFirstInGroup &&
                  (isOwnMessage ? "wa-tail-out" : "wa-tail-in"),
                isDeleted && "italic opacity-60",
                isPending && "opacity-70"
              )}
            >
              {/* Message content */}
              {isDeleted ? (
                <span className="text-muted-foreground text-sm">
                  {m?.ui?.this_message_deleted || "This message was deleted"}
                </span>
              ) : (
                <>
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>

                  {/* Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-1.5 space-y-1">
                      {message.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-foreground/5 hover:bg-foreground/10 flex items-center gap-2 rounded p-1.5 transition-colors"
                        >
                          <span className="truncate text-xs">
                            {attachment.name}
                          </span>
                          <span className="text-muted-foreground text-[10px]">
                            {attachment.size}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Timestamp + read receipts — inside bubble, bottom-end */}
                  {showTimestamp && isLastInGroup && (
                    <span
                      className={cn(
                        "float-end ms-2 mt-0.5 flex items-center gap-0.5 text-[11px]",
                        isOwnMessage
                          ? "text-foreground/50"
                          : "text-muted-foreground"
                      )}
                    >
                      {isEdited && (
                        <span className="me-0.5">
                          {m?.ui?.edited || "edited"}
                        </span>
                      )}
                      <span>
                        {format(new Date(message.createdAt), "p", {
                          locale: dateLocale,
                        })}
                      </span>
                      {isOwnMessage && (
                        <span className="ms-0.5">
                          <ReadReceiptIcon status={message.status} />
                        </span>
                      )}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Hover action — dropdown arrow at top corner */}
            {!isDeleted && (
              <div
                className={cn(
                  "absolute top-1 z-10 opacity-0 transition-opacity group-hover/bubble:opacity-100",
                  isOwnMessage ? "start-1" : "end-1"
                )}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full",
                        isOwnMessage
                          ? "bg-msg-outgoing/80 hover:bg-msg-outgoing"
                          : "bg-msg-incoming/80 hover:bg-msg-incoming"
                      )}
                    >
                      <ChevronDown className="text-muted-foreground h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align={isOwnMessage ? "start" : "end"}
                    className="w-40"
                  >
                    <DropdownMenuItem
                      onClick={() => setShowReactions(!showReactions)}
                    >
                      <Smile className="me-2 h-4 w-4" />
                      {m?.actions?.react || "React"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onReply?.(message)}>
                      <Reply className="me-2 h-4 w-4" />
                      {m?.actions?.reply || "Reply"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopy}>
                      <Copy className="me-2 h-4 w-4" />
                      {m?.actions?.copy || "Copy"}
                    </DropdownMenuItem>
                    {isOwnMessage && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit?.(message)}>
                          <Pencil className="me-2 h-4 w-4" />
                          {m?.actions?.edit || "Edit"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete?.(message.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="me-2 h-4 w-4" />
                          {m?.actions?.delete || "Delete"}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Reactions — below bubble, overlapping slightly */}
          {hasReactions && (
            <div className="ms-2 -mt-1.5 flex flex-wrap gap-1">
              {Object.entries(reactionGroups).map(([emoji, reactions]) => {
                const hasUserReacted = reactions.some(
                  (r) => r.userId === currentUserId
                )
                return (
                  <button
                    key={emoji}
                    onClick={() => handleReactionClick(emoji)}
                    className={cn(
                      "bg-card border-border inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs shadow-sm transition-colors",
                      hasUserReacted &&
                        "border-msg-unread-badge bg-msg-unread-badge/10"
                    )}
                  >
                    <span>{emoji}</span>
                    <span className="text-muted-foreground text-[10px]">
                      {reactions.length}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Quick reaction picker */}
          {showReactions && !isDeleted && (
            <div className="bg-card border-border mt-1 flex gap-1 rounded-full border px-2 py-1 shadow-lg">
              {commonEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    handleReactionClick(emoji)
                    setShowReactions(false)
                  }}
                  className="hover:bg-muted rounded-full p-1 text-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
