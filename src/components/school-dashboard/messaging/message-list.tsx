"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useMemo, useRef, useState } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { format, isToday, isYesterday } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { ArrowDown, LoaderCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { AutoScroller, useIsAtBottom } from "./auto-scroller"
import { ChatEmpty } from "./empty-state"
import { groupMessages, MessageGroup } from "./message-group"
import type { ConversationType, MessageDTO } from "./types"

export interface MessageListProps {
  messages: MessageDTO[]
  currentUserId: string
  locale?: "ar" | "en"
  conversationType?: ConversationType
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  onReply?: (message: MessageDTO) => void
  onEdit?: (message: MessageDTO) => void
  onDelete?: (messageId: string) => void
  onReact?: (messageId: string, emoji: string) => void
  onRemoveReaction?: (reactionId: string) => void
  className?: string
  enableVirtualization?: boolean
}

// Virtual list item types
type VirtualListItem =
  | { type: "date-separator"; dateKey: string; label: string }
  | {
      type: "message-group"
      dateKey: string
      groupIndex: number
      messages: MessageDTO[]
    }
  | { type: "loader"; position: "top" | "bottom" }

export function MessageList({
  messages,
  currentUserId,
  locale = "en",
  conversationType,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onRemoveReaction,
  className,
  enableVirtualization = true,
}: MessageListProps) {
  const { dictionary } = useDictionary()
  const m = dictionary?.messaging
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const isAtBottom = useIsAtBottom(
    scrollContainerRef as React.RefObject<HTMLDivElement>,
    150
  )
  const [hasScrolledUp, setHasScrolledUp] = useState(false)
  const dateLocale = locale === "ar" ? ar : enUS

  // Group messages by date
  const messagesByDate = useMemo(() => {
    return messages.reduce(
      (groups, message) => {
        const date = new Date(message.createdAt)
        const dateKey = format(date, "yyyy-MM-dd")

        if (!groups[dateKey]) {
          groups[dateKey] = []
        }
        groups[dateKey].push(message)
        return groups
      },
      {} as Record<string, MessageDTO[]>
    )
  }, [messages])

  const getDateLabel = (dateString: string): string => {
    const date = new Date(dateString)
    if (isToday(date)) {
      return m?.ui?.today || "Today"
    }
    if (isYesterday(date)) {
      return m?.ui?.yesterday || "Yesterday"
    }
    return format(date, "PPP", { locale: dateLocale })
  }

  // Build flat list for virtualization
  const virtualListItems = useMemo<VirtualListItem[]>(() => {
    const items: VirtualListItem[] = []

    if (isLoading && hasMore) {
      items.push({ type: "loader", position: "top" })
    }

    Object.entries(messagesByDate).forEach(([dateKey, dayMessages]) => {
      items.push({
        type: "date-separator",
        dateKey,
        label: getDateLabel(dateKey),
      })

      const messageGroups = groupMessages(dayMessages)
      messageGroups.forEach((group, groupIndex) => {
        items.push({
          type: "message-group",
          dateKey,
          groupIndex,
          messages: group,
        })
      })
    })

    if (isLoading && !hasMore) {
      items.push({ type: "loader", position: "bottom" })
    }

    return items
  }, [messagesByDate, isLoading, hasMore, locale])

  // Virtual scrolling
  const virtualizer = useVirtualizer({
    count: virtualListItems.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (index) => {
      const item = virtualListItems[index]
      if (item.type === "date-separator") return 40
      if (item.type === "loader") return 36
      return item.messages.length * 50
    },
    overscan: 5,
    enabled: enableVirtualization,
  })

  const handleScrollToTop = () => {
    if (hasMore && !isLoading && onLoadMore) {
      setHasScrolledUp(true)
      onLoadMore()
    }
  }

  const scrollToBottom = () => {
    if (enableVirtualization) {
      virtualizer.scrollToIndex(virtualListItems.length - 1, {
        align: "end",
        behavior: "smooth",
      })
    } else {
      scrollContainerRef.current?.scroll({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (
      enableVirtualization &&
      virtualListItems.length > 0 &&
      (isAtBottom || !hasScrolledUp)
    ) {
      virtualizer.scrollToIndex(virtualListItems.length - 1, { align: "end" })
    }
  }, [virtualListItems.length, enableVirtualization, isAtBottom, hasScrolledUp])

  if (messages.length === 0 && !isLoading) {
    return (
      <div className={cn("flex-1", className)}>
        <ChatEmpty locale={locale} />
      </div>
    )
  }

  // Render virtualized list
  if (enableVirtualization) {
    return (
      <div className={cn("relative flex-1 bg-[#EEEAE4]", className)}>
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage: "url('/whatsapp-bg.png')",
            backgroundSize: "60%",
            backgroundRepeat: "repeat",
          }}
        />
        <div
          ref={scrollContainerRef}
          className="relative h-full flex-1 overflow-x-hidden overflow-y-auto"
          onScroll={handleScrollToTop}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const item = virtualListItems[virtualItem.index]

              return (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    insetInlineStart: 0,
                    width: "100%",
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  {item.type === "loader" && (
                    <div className="flex justify-center py-2">
                      <LoaderCircle className="text-muted-foreground h-5 w-5 animate-spin" />
                    </div>
                  )}

                  {item.type === "date-separator" && (
                    <div className="my-3 flex items-center justify-center">
                      <span
                        className="border-muted text-foreground/80 rounded-md border px-2.5 py-0.5 text-[11px] font-medium"
                        style={{ backgroundColor: "#FEFDFC" }}
                      >
                        {item.label}
                      </span>
                    </div>
                  )}

                  {item.type === "message-group" && (
                    <div className="mb-1">
                      <MessageGroup
                        messages={item.messages}
                        currentUserId={currentUserId}
                        locale={locale}
                        conversationType={conversationType}
                        onReply={onReply}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onReact={onReact}
                        onRemoveReaction={onRemoveReaction}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Scroll to bottom — WhatsApp circular button */}
        {!isAtBottom && messages.length > 0 && (
          <div className="absolute end-4 bottom-4 z-10">
            <Button
              variant="secondary"
              size="icon"
              className="bg-card border-border h-10 w-10 rounded-full border shadow-md"
              onClick={scrollToBottom}
            >
              <ArrowDown className="text-muted-foreground h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Non-virtualized fallback
  return (
    <div className={cn("relative flex-1 bg-[#EEEAE4]", className)}>
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: "url('/whatsapp-bg.png')",
          backgroundSize: "60%",
          backgroundRepeat: "repeat",
        }}
      />
      <AutoScroller
        ref={scrollContainerRef}
        className="relative h-full flex-1 overflow-x-hidden overflow-y-auto"
        enabled={isAtBottom || !hasScrolledUp}
        onScrollToTop={handleScrollToTop}
      >
        <div className="py-3">
          {isLoading && hasMore && (
            <div className="flex justify-center py-2">
              <LoaderCircle className="text-muted-foreground h-5 w-5 animate-spin" />
            </div>
          )}

          {Object.entries(messagesByDate).map(([dateKey, dayMessages]) => {
            const messageGroups = groupMessages(dayMessages)

            return (
              <div key={dateKey}>
                {/* Date separator — WhatsApp pill */}
                <div className="my-3 flex items-center justify-center">
                  <span
                    className="border-muted text-foreground/80 rounded-md border px-2.5 py-0.5 text-[11px] font-medium"
                    style={{ backgroundColor: "#FEFDFC" }}
                  >
                    {getDateLabel(dateKey)}
                  </span>
                </div>

                {/* Message groups */}
                <div className="space-y-1">
                  {messageGroups.map((group, groupIndex) => (
                    <MessageGroup
                      key={`group-${dateKey}-${groupIndex}`}
                      messages={group}
                      currentUserId={currentUserId}
                      locale={locale}
                      conversationType={conversationType}
                      onReply={onReply}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onReact={onReact}
                      onRemoveReaction={onRemoveReaction}
                    />
                  ))}
                </div>
              </div>
            )
          })}

          {isLoading && !hasMore && (
            <div className="flex justify-center py-2">
              <LoaderCircle className="text-muted-foreground h-5 w-5 animate-spin" />
            </div>
          )}
        </div>
      </AutoScroller>

      {!isAtBottom && messages.length > 0 && (
        <div className="absolute end-4 bottom-4 z-10">
          <Button
            variant="secondary"
            size="icon"
            className="bg-card border-border h-10 w-10 rounded-full border shadow-md"
            onClick={scrollToBottom}
          >
            <ArrowDown className="text-muted-foreground h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  )
}

export function MessageListSkeleton({
  locale = "en",
}: {
  locale?: "ar" | "en"
}) {
  return (
    <div className="wa-doodle-bg flex-1 px-4 py-4">
      {/* Date pill skeleton */}
      <div className="my-3 flex items-center justify-center">
        <Skeleton className="h-6 w-20 rounded-lg" />
      </div>

      {/* Message group skeletons */}
      {Array.from({ length: 3 }).map((_, groupIndex) => (
        <div key={groupIndex} className="mb-2 space-y-[2px]">
          {Array.from({ length: 2 + (groupIndex % 2) }).map((_, msgIndex) => (
            <div
              key={msgIndex}
              className={cn(
                "flex w-full px-4 py-[1px]",
                groupIndex % 2 === 0 ? "justify-end" : "justify-start"
              )}
            >
              <Skeleton
                className={cn(
                  "rounded-lg",
                  groupIndex % 2 === 0 ? "rounded-se-sm" : "rounded-ss-sm",
                  msgIndex % 3 === 0
                    ? "h-10 w-44"
                    : msgIndex % 3 === 1
                      ? "h-12 w-56"
                      : "h-8 w-48"
                )}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
