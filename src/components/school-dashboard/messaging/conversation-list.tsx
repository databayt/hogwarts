"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useRef, useState } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  EllipsisVertical,
  LoaderCircle,
  MessageSquarePlus,
  Search,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { ConversationCard, ConversationCardSkeleton } from "./conversation-card"
import { ConversationListEmpty } from "./empty-state"
import type { ConversationDTO, ConversationType } from "./types"

export interface ConversationListProps {
  conversations: ConversationDTO[]
  currentUserId: string
  locale?: "ar" | "en"
  activeConversationId?: string | null
  isLoading?: boolean
  onConversationClick?: (conversationId: string) => void
  onNewConversation?: () => void
  onArchive?: (conversationId: string) => void
  onDelete?: (conversationId: string) => void
  onPin?: (conversationId: string) => void
  onMute?: (conversationId: string) => void
  className?: string
}

type FilterType = "all" | "unread" | "groups" | "direct"

export function ConversationList({
  conversations,
  currentUserId,
  locale = "en",
  activeConversationId,
  isLoading = false,
  onConversationClick,
  onNewConversation,
  onArchive,
  onDelete,
  onPin,
  onMute,
  className,
}: ConversationListProps) {
  const { dictionary } = useDictionary()
  const m = dictionary?.messaging
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<FilterType>("all")

  // Filter conversations
  const filteredConversations = conversations.filter((conversation) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesTitle = conversation.title?.toLowerCase().includes(query)
      const matchesLastMessage = conversation.lastMessage?.content
        .toLowerCase()
        .includes(query)

      const matchesParticipant =
        conversation.type === "direct" &&
        conversation.participants?.some(
          (p) =>
            p.userId !== currentUserId &&
            (p.user.username?.toLowerCase().includes(query) ||
              p.user.email?.toLowerCase().includes(query))
        )

      if (!matchesTitle && !matchesLastMessage && !matchesParticipant) {
        return false
      }
    }

    // Tab filters
    if (filter === "unread" && (conversation.unreadCount ?? 0) === 0) {
      return false
    }
    if (filter === "groups" && conversation.type === "direct") {
      return false
    }
    if (filter === "direct" && conversation.type !== "direct") {
      return false
    }

    return true
  })

  // Sort: pinned first, then by last message time
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    const aParticipant = a.participants?.find((p) => p.userId === currentUserId)
    const bParticipant = b.participants?.find((p) => p.userId === currentUserId)

    if (aParticipant?.isPinned && !bParticipant?.isPinned) return -1
    if (!aParticipant?.isPinned && bParticipant?.isPinned) return 1

    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
    return bTime - aTime
  })

  const unreadCount = conversations.filter(
    (c) => (c.unreadCount ?? 0) > 0
  ).length

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: "all", label: m?.ui?.all_filter || "All" },
    {
      value: "unread",
      label:
        unreadCount > 0
          ? `${m?.ui?.unread_filter || "Unread"} (${unreadCount})`
          : m?.ui?.unread_filter || "Unread",
    },
    { value: "groups", label: m?.types?.group_short || "Groups" },
    { value: "direct", label: m?.types?.direct_short || "Direct" },
  ]

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      {/* Header — WhatsApp style: 60px, title + action icons */}
      <div className="bg-msg-header-bg flex h-[60px] flex-shrink-0 items-center justify-between px-4">
        <h2 className="text-foreground text-xl font-bold">
          {m?.ui?.title || "Chats"}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewConversation}
            className="h-10 w-10 rounded-full"
            aria-label={m?.ui?.new_conversation || "New conversation"}
          >
            <MessageSquarePlus className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full"
              >
                <EllipsisVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                {m?.ui?.archived || "Archived"}
              </DropdownMenuItem>
              <DropdownMenuItem>
                {m?.ui?.starred || "Starred messages"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search — WhatsApp pill shape */}
      <div className="px-3 py-2">
        <div className="bg-msg-input-bg relative flex items-center rounded-[21px]">
          <Search className="text-muted-foreground absolute start-3 h-4 w-4" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={m?.ui?.search_dots || "Search..."}
            className="placeholder:text-muted-foreground w-full bg-transparent py-2 ps-9 pe-4 text-sm outline-none"
          />
        </div>
      </div>

      {/* Filter chips — horizontal scrollable pills */}
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-3 pb-2">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={cn(
              "flex-shrink-0 rounded-full px-3 py-1 text-sm transition-colors",
              filter === opt.value
                ? "bg-msg-unread-badge font-medium text-white"
                : "bg-msg-hover text-foreground hover:bg-msg-hover/80"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Conversation list — virtualized for performance */}
      {isLoading ? (
        <div className="flex-1 overflow-y-auto">
          {Array.from({ length: 8 }).map((_, i) => (
            <ConversationCardSkeleton key={i} />
          ))}
        </div>
      ) : sortedConversations.length === 0 ? (
        <div className="flex-1 overflow-y-auto">
          {searchQuery || filter !== "all" ? (
            <div className="flex h-64 flex-col items-center justify-center p-4 text-center">
              <Search className="text-muted-foreground/50 mb-3 h-8 w-8" />
              <p className="text-muted-foreground">
                {m?.ui?.no_matching_conversations ||
                  "No matching conversations"}
              </p>
              <p className="text-muted-foreground/70 mt-1 text-sm">
                {m?.ui?.try_different_terms || "Try different search terms"}
              </p>
            </div>
          ) : (
            <ConversationListEmpty
              locale={locale}
              onNewConversation={onNewConversation}
            />
          )}
        </div>
      ) : (
        <VirtualizedConversationList
          conversations={sortedConversations}
          currentUserId={currentUserId}
          locale={locale}
          activeConversationId={activeConversationId}
          onConversationClick={onConversationClick}
          onArchive={onArchive}
          onDelete={onDelete}
          onPin={onPin}
          onMute={onMute}
        />
      )}
    </div>
  )
}

// Virtualized conversation list for performance at scale
function VirtualizedConversationList({
  conversations,
  currentUserId,
  locale,
  activeConversationId,
  onConversationClick,
  onArchive,
  onDelete,
  onPin,
  onMute,
}: {
  conversations: ConversationDTO[]
  currentUserId: string
  locale: "ar" | "en"
  activeConversationId?: string | null
  onConversationClick?: (conversationId: string) => void
  onArchive?: (conversationId: string) => void
  onDelete?: (conversationId: string) => void
  onPin?: (conversationId: string) => void
  onMute?: (conversationId: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: conversations.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 72,
    overscan: 5,
  })

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const conversation = conversations[virtualRow.index]
          return (
            <div
              key={conversation.id}
              style={{
                position: "absolute",
                top: 0,
                insetInlineStart: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <ConversationCard
                conversation={conversation}
                currentUserId={currentUserId}
                locale={locale}
                isActive={conversation.id === activeConversationId}
                onClick={onConversationClick}
                onArchive={onArchive}
                onDelete={onDelete}
                onPin={onPin}
                onMute={onMute}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
