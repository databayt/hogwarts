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
  onRetry?: (messageId: string) => void
  savedScrollPosition?: number
  onSaveScrollPosition?: (position: number) => void
  unreadCount?: number
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
  | { type: "unread-divider"; count: number }

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
  onRetry,
  savedScrollPosition = -1,
  onSaveScrollPosition,
  unreadCount = 0,
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
  const [newMsgCount, setNewMsgCount] = useState(0)
  const prevMsgCountRef = useRef(messages.length)
  const dateLocale = locale === "ar" ? ar : enUS

  // Track new messages arriving while scrolled up (for FAB badge)
  useEffect(() => {
    const added = messages.length - prevMsgCountRef.current
    prevMsgCountRef.current = messages.length
    if (added > 0 && !isAtBottom) {
      setNewMsgCount((c) => c + added)
    }
    if (isAtBottom) {
      setNewMsgCount(0)
    }
  }, [messages.length, isAtBottom])

  // Scroll anchoring for history load (prepend)
  const isPrependingRef = useRef(false)
  const prevItemCountRef = useRef(0)
  const anchorIndexRef = useRef<number | null>(null)

  // Group messages by date, sorted ascending (oldest first — WhatsApp order)
  const messagesByDate = useMemo(() => {
    const groups = messages.reduce(
      (acc, message) => {
        const date = new Date(message.createdAt)
        const dateKey = format(date, "yyyy-MM-dd")

        if (!acc[dateKey]) {
          acc[dateKey] = []
        }
        acc[dateKey].push(message)
        return acc
      },
      {} as Record<string, MessageDTO[]>
    )

    // Sort messages within each date group ascending by createdAt
    for (const msgs of Object.values(groups)) {
      msgs.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    }

    return groups
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

    Object.entries(messagesByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([dateKey, dayMessages]) => {
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

    // Insert unread divider — count messages from end to find split point
    if (unreadCount > 0) {
      let msgCount = 0
      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i]
        if (item.type === "message-group") {
          msgCount += item.messages.length
          if (msgCount >= unreadCount) {
            items.splice(i, 0, { type: "unread-divider", count: unreadCount })
            break
          }
        }
      }
    }

    return items
  }, [messagesByDate, isLoading, hasMore, locale, unreadCount])

  // Virtual scrolling
  const virtualizer = useVirtualizer({
    count: virtualListItems.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (index) => {
      const item = virtualListItems[index]
      if (item.type === "date-separator") return 40
      if (item.type === "loader") return 36
      if (item.type === "unread-divider") return 36
      return item.messages.length * 50
    },
    overscan: 5,
    enabled: enableVirtualization,
  })

  const handleScrollToTop = () => {
    const el = scrollContainerRef.current
    if (!el) return
    // Only trigger load more when scrolled near the top (within 100px)
    if (el.scrollTop < 100 && hasMore && !isLoading && onLoadMore) {
      setHasScrolledUp(true)

      // Save anchor before loading older messages
      if (enableVirtualization) {
        const visibleItems = virtualizer.getVirtualItems()
        if (visibleItems.length > 0) {
          anchorIndexRef.current = visibleItems[0].index
        }
        isPrependingRef.current = true
        prevItemCountRef.current = virtualListItems.length
      }

      onLoadMore()
    }
  }

  // Save scroll position for conversation cache
  const handleScroll = () => {
    const el = scrollContainerRef.current
    if (el && onSaveScrollPosition) {
      onSaveScrollPosition(el.scrollTop)
    }
    handleScrollToTop()
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

  // Auto-scroll to bottom on new messages, with scroll anchoring on prepend
  useEffect(() => {
    if (!enableVirtualization || virtualListItems.length === 0) return

    if (isPrependingRef.current && prevItemCountRef.current > 0) {
      // History was prepended — restore anchor position
      const addedCount = virtualListItems.length - prevItemCountRef.current
      if (addedCount > 0 && anchorIndexRef.current !== null) {
        const newIndex = anchorIndexRef.current + addedCount
        requestAnimationFrame(() => {
          virtualizer.scrollToIndex(newIndex, { align: "start" })
        })
      }
      isPrependingRef.current = false
      anchorIndexRef.current = null
      return
    }

    // Normal case: auto-scroll to bottom for new messages
    if (isAtBottom || !hasScrolledUp) {
      virtualizer.scrollToIndex(virtualListItems.length - 1, { align: "end" })
    }
  }, [virtualListItems.length, enableVirtualization, isAtBottom, hasScrolledUp])

  if (messages.length === 0 && !isLoading) {
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
          onScroll={handleScroll}
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

                  {item.type === "unread-divider" && (
                    <div className="my-2 flex items-center justify-center px-8">
                      <div className="flex-1 border-t border-[#06CF9C]" />
                      <span className="mx-3 rounded-full bg-[#06CF9C] px-3 py-0.5 text-[11px] font-medium text-white uppercase">
                        {item.count}{" "}
                        {(m?.ui as Record<string, string>)?.unread_messages ||
                          "unread messages"}
                      </span>
                      <div className="flex-1 border-t border-[#06CF9C]" />
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
                        onRetry={onRetry}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Scroll to bottom — WhatsApp circular button with unread badge */}
        {!isAtBottom && messages.length > 0 && (
          <div className="absolute end-4 bottom-4 z-10">
            <Button
              variant="secondary"
              size="icon"
              className="bg-card border-border relative h-10 w-10 rounded-full border shadow-md"
              onClick={() => {
                scrollToBottom()
                setNewMsgCount(0)
              }}
            >
              <ArrowDown className="text-muted-foreground h-5 w-5" />
              {newMsgCount > 0 && (
                <span className="absolute -end-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#06CF9C] px-1 text-[10px] font-bold text-white">
                  {newMsgCount > 99 ? "99+" : newMsgCount}
                </span>
              )}
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

          {Object.entries(messagesByDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([dateKey, dayMessages]) => {
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
                        onRetry={onRetry}
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
            className="bg-card border-border relative h-10 w-10 rounded-full border shadow-md"
            onClick={() => {
              scrollToBottom()
              setNewMsgCount(0)
            }}
          >
            <ArrowDown className="text-muted-foreground h-5 w-5" />
            {newMsgCount > 0 && (
              <span className="absolute -end-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#06CF9C] px-1 text-[10px] font-bold text-white">
                {newMsgCount > 99 ? "99+" : newMsgCount}
              </span>
            )}
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
