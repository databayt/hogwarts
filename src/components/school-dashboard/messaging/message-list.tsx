"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { format, isToday, isYesterday } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { ArrowDown, LoaderCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

import { AutoScroller, useIsAtBottom } from "./auto-scroller"
import { ChatEmpty } from "./empty-state"
import { groupMessages, MessageGroup } from "./message-group"
import type { MessageDTO } from "./types"

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
  enableVirtualization?: boolean // Toggle for virtual scrolling
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
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onRemoveReaction,
  className,
  enableVirtualization = true, // Default to enabled for performance
}: MessageListProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const isAtBottom = useIsAtBottom(
    scrollContainerRef as React.RefObject<HTMLDivElement>,
    150
  )
  const [hasScrolledUp, setHasScrolledUp] = useState(false)
  const dateLocale = locale === "ar" ? ar : enUS

  // Group messages by date first
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
      return locale === "ar" ? "اليوم" : "Today"
    }
    if (isYesterday(date)) {
      return locale === "ar" ? "أمس" : "Yesterday"
    }
    return format(date, "PPP", { locale: dateLocale })
  }

  // Build flat list for virtualization
  const virtualListItems = useMemo<VirtualListItem[]>(() => {
    const items: VirtualListItem[] = []

    // Top loader
    if (isLoading && hasMore) {
      items.push({ type: "loader", position: "top" })
    }

    // Date groups with message groups
    Object.entries(messagesByDate).forEach(([dateKey, dayMessages]) => {
      // Add date separator
      items.push({
        type: "date-separator",
        dateKey,
        label: getDateLabel(dateKey),
      })

      // Add message groups for this date
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

    // Bottom loader
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
      if (item.type === "date-separator") return 60 // Date separator height
      if (item.type === "loader") return 40 // Loader height
      // Message group: estimate based on message count (avg 80px per message)
      return item.messages.length * 80
    },
    overscan: 5, // Render 5 extra items above/below viewport
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
      // For virtualized list, scroll to last item
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

  // Auto-scroll to bottom on new messages (virtualized)
  useEffect(() => {
    if (
      enableVirtualization &&
      virtualListItems.length > 0 &&
      (isAtBottom || !hasScrolledUp)
    ) {
      // Scroll to bottom when new messages arrive
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
      <div className={cn("bg-background relative flex-1", className)}>
        <div
          ref={scrollContainerRef}
          className="h-full flex-1 overflow-x-hidden overflow-y-auto"
          onScroll={handleScrollToTop}
        >
          {/* Virtual list container */}
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {/* Render only visible items */}
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
                    left: 0,
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
                    <div className="my-6 flex items-center justify-center">
                      <div className="bg-muted/50 text-muted-foreground rounded-full px-4 py-1.5 text-xs font-medium backdrop-blur-sm">
                        {item.label}
                      </div>
                    </div>
                  )}

                  {item.type === "message-group" && (
                    <div className="mb-6">
                      <MessageGroup
                        messages={item.messages}
                        currentUserId={currentUserId}
                        locale={locale}
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

        {/* Scroll to bottom button - appears when user scrolls up */}
        {!isAtBottom && messages.length > 0 && (
          <div className="absolute right-4 bottom-4 z-10">
            <Button
              variant="secondary"
              size="icon"
              className="animate-in fade-in slide-in-from-bottom-2 h-10 w-10 rounded-full shadow-lg"
              onClick={scrollToBottom}
            >
              <ArrowDown className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Non-virtualized rendering (fallback)
  return (
    <div className={cn("bg-background relative flex-1", className)}>
      <AutoScroller
        ref={scrollContainerRef}
        className="h-full flex-1 overflow-x-hidden overflow-y-auto"
        enabled={isAtBottom || !hasScrolledUp}
        onScrollToTop={handleScrollToTop}
      >
        <div className="space-y-6 py-4">
          {/* Loading indicator at top */}
          {isLoading && hasMore && (
            <div className="flex justify-center py-2">
              <LoaderCircle className="text-muted-foreground h-5 w-5 animate-spin" />
            </div>
          )}

          {/* Messages grouped by date */}
          {Object.entries(messagesByDate).map(([dateKey, dayMessages]) => {
            // Group messages by sender and time within each day
            const messageGroups = groupMessages(dayMessages)

            return (
              <div key={dateKey} className="space-y-4">
                {/* Date separator - iMessage style */}
                <div className="my-6 flex items-center justify-center">
                  <div className="bg-muted/50 text-muted-foreground rounded-full px-4 py-1.5 text-xs font-medium backdrop-blur-sm">
                    {getDateLabel(dateKey)}
                  </div>
                </div>

                {/* Message groups for this day */}
                <div className="space-y-6">
                  {messageGroups.map((group, groupIndex) => (
                    <MessageGroup
                      key={`group-${dateKey}-${groupIndex}`}
                      messages={group}
                      currentUserId={currentUserId}
                      locale={locale}
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

          {/* Loading indicator at bottom */}
          {isLoading && !hasMore && (
            <div className="flex justify-center py-2">
              <LoaderCircle className="text-muted-foreground h-5 w-5 animate-spin" />
            </div>
          )}
        </div>
      </AutoScroller>

      {/* Scroll to bottom button - appears when user scrolls up */}
      {!isAtBottom && messages.length > 0 && (
        <div className="absolute right-4 bottom-4 z-10">
          <Button
            variant="secondary"
            size="icon"
            className="animate-in fade-in slide-in-from-bottom-2 h-10 w-10 rounded-full shadow-lg"
            onClick={scrollToBottom}
          >
            <ArrowDown className="h-5 w-5" />
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
    <div className="bg-background flex-1 space-y-6 px-4 py-4">
      {/* Date separator skeleton */}
      <div className="my-6 flex items-center justify-center">
        <div className="bg-muted/50 h-6 w-24 animate-pulse rounded-full" />
      </div>

      {/* Message group skeletons */}
      {Array.from({ length: 3 }).map((_, groupIndex) => (
        <div key={groupIndex} className="space-y-1">
          {Array.from({ length: 2 + (groupIndex % 2) }).map((_, msgIndex) => (
            <div
              key={msgIndex}
              className={cn(
                "flex w-full px-4 py-1",
                groupIndex % 2 === 0 ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "flex max-w-[65%] gap-2",
                  groupIndex % 2 === 0 ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar skeleton - only on last message */}
                {groupIndex % 2 === 1 && msgIndex === 0 && (
                  <div className="bg-muted h-7 w-7 flex-shrink-0 animate-pulse rounded-full" />
                )}
                {groupIndex % 2 === 1 && msgIndex !== 0 && (
                  <div className="h-7 w-7 flex-shrink-0" />
                )}

                <div className="flex flex-col gap-1">
                  {/* Sender name skeleton - only on first message */}
                  {groupIndex % 2 === 1 && msgIndex === 0 && (
                    <div className="bg-muted ms-3 mb-1 h-3 w-20 animate-pulse rounded" />
                  )}

                  {/* Message bubble skeleton */}
                  <div
                    className={cn(
                      "bg-muted animate-pulse rounded-[18px]",
                      groupIndex % 2 === 0
                        ? "rounded-tr-[4px]"
                        : "rounded-tl-[4px]",
                      msgIndex % 3 === 0
                        ? "h-16 w-48"
                        : msgIndex % 3 === 1
                          ? "h-20 w-64"
                          : "h-12 w-56"
                    )}
                  />

                  {/* Timestamp skeleton - only on last message */}
                  {msgIndex === 1 + (groupIndex % 2) && (
                    <div className="bg-muted mt-1 h-2 w-16 animate-pulse rounded" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
