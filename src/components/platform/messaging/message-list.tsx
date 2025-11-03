"use client"

import { useEffect, useRef, useState } from "react"
import { format, isToday, isYesterday, isSameDay } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { Loader2 } from "lucide-react"
import type { MessageDTO } from "./types"
import { MessageBubble } from "./message-bubble"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface MessageListProps {
  messages: MessageDTO[]
  currentUserId: string
  locale?: "ar" | "en"
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  onReply?: (message: MessageDTO) => void
  onEdit?: (message: MessageDTO) => void
  onDelete?: (messageId: string) => void
  onReact?: (messageId: string, emoji: string) => void
  onRemoveReaction?: (reactionId: string) => void
  className?: string
}

export function MessageList({
  messages,
  currentUserId,
  locale = "en",
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onRemoveReaction,
  className,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const dateLocale = locale === "ar" ? ar : enUS

  // Auto-scroll to bottom on new messages if near bottom
  useEffect(() => {
    if (shouldScrollToBottom && isNearBottom && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, shouldScrollToBottom, isNearBottom])

  // Initial scroll to bottom
  useEffect(() => {
    if (bottomRef.current && messages.length > 0) {
      bottomRef.current.scrollIntoView()
    }
  }, [])

  // Detect if user is near bottom
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const isBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100
    setIsNearBottom(isBottom)

    // Load more when scrolling to top
    if (target.scrollTop < 100 && hasMore && !isLoading && onLoadMore) {
      onLoadMore()
    }
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt)
    const dateKey = format(date, "yyyy-MM-dd")

    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(message)
    return groups
  }, {} as Record<string, MessageDTO[]>)

  const getDateLabel = (dateString: string): string => {
    const date = new Date(dateString)
    if (isToday(date)) {
      return locale === "ar" ? "اليوم" : "Today"
    }
    if (isYesterday(date)) {
      return locale === "ar" ? "أمس" : "Yesterday"
    }
    return format(date, "PPP", { locale: dateLocale })
  }

  const shouldShowSender = (message: MessageDTO, index: number, dayMessages: MessageDTO[]): boolean => {
    if (index === 0) return true
    const prevMessage = dayMessages[index - 1]
    if (!prevMessage) return true
    if (prevMessage.senderId !== message.senderId) return true

    // Show sender if more than 5 minutes between messages
    const timeDiff = new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime()
    return timeDiff > 5 * 60 * 1000
  }

  if (messages.length === 0 && !isLoading) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">
            {locale === "ar" ? "لا توجد رسائل بعد" : "No messages yet"}
          </p>
          <p className="text-sm text-muted-foreground">
            {locale === "ar"
              ? "ابدأ المحادثة بإرسال رسالة"
              : "Start the conversation by sending a message"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea
      className={cn("flex-1 px-4", className)}
      onScroll={handleScroll}
    >
      <div ref={scrollRef} className="space-y-4 py-4">
        {/* Loading indicator at top */}
        {isLoading && hasMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Messages grouped by date */}
        {Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
          <div key={dateKey} className="space-y-1">
            {/* Date separator */}
            <div className="flex items-center justify-center my-4">
              <div className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
                {getDateLabel(dateKey)}
              </div>
            </div>

            {/* Messages for this day */}
            {dayMessages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                currentUserId={currentUserId}
                locale={locale}
                showSender={shouldShowSender(message, index, dayMessages)}
                compact={!shouldShowSender(message, index, dayMessages)}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onReact={onReact}
                onRemoveReaction={onRemoveReaction}
              />
            ))}
          </div>
        ))}

        {/* Loading indicator at bottom */}
        {isLoading && !hasMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}

export function MessageListSkeleton({ locale = "en" }: { locale?: "ar" | "en" }) {
  return (
    <div className="flex-1 px-4 py-4 space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex gap-3",
            i % 2 === 0 ? "flex-row" : "flex-row-reverse"
          )}
        >
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          <div className="flex flex-col gap-2 max-w-[70%]">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div
              className={cn(
                "h-16 rounded-2xl bg-muted animate-pulse",
                i % 3 === 0 ? "w-48" : i % 3 === 1 ? "w-64" : "w-56"
              )}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
