"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"
import {
  ListFilter,
  LoaderCircle,
  MessageSquarePlus,
  Search,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  const [filter, setFilter] = useState<"all" | "unread" | "pinned">("all")
  const [typeFilter, setTypeFilter] = useState<ConversationType | "all">("all")

  // Filter conversations
  const filteredConversations = conversations.filter((conversation) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesTitle = conversation.title?.toLowerCase().includes(query)
      const matchesLastMessage = conversation.lastMessage?.content
        .toLowerCase()
        .includes(query)

      // For direct conversations, search in participant names
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

    // Unread filter
    if (filter === "unread" && (conversation.unreadCount ?? 0) === 0) {
      return false
    }

    // Pinned filter
    if (filter === "pinned") {
      const currentParticipant = conversation.participants?.find(
        (p) => p.userId === currentUserId
      )
      if (!currentParticipant?.isPinned) {
        return false
      }
    }

    // Type filter
    if (typeFilter !== "all" && conversation.type !== typeFilter) {
      return false
    }

    return true
  })

  // Sort: pinned first, then by last message time
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    const aParticipant = a.participants?.find((p) => p.userId === currentUserId)
    const bParticipant = b.participants?.find((p) => p.userId === currentUserId)

    // Pinned conversations first
    if (aParticipant?.isPinned && !bParticipant?.isPinned) return -1
    if (!aParticipant?.isPinned && bParticipant?.isPinned) return 1

    // Then by last message time
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
    return bTime - aTime
  })

  const unreadCount = conversations.filter(
    (c) => (c.unreadCount ?? 0) > 0
  ).length
  const pinnedCount = conversations.filter(
    (c) => c.participants?.find((p) => p.userId === currentUserId)?.isPinned
  ).length

  return (
    <div
      className={cn("border-border flex h-full flex-col border-e", className)}
    >
      {/* Header */}
      <div className="border-border space-y-3 border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground text-lg font-semibold">
            {m?.ui?.title || "Messages"}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewConversation}
            className="flex-shrink-0"
          >
            <MessageSquarePlus className="h-5 w-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="text-muted-foreground absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={m?.ui?.search_dots || "Search..."}
            className="ps-9"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Tabs
            value={filter}
            onValueChange={(v) => setFilter(v as typeof filter)}
            className="flex-1"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                {m?.ui?.all_filter || "All"}
              </TabsTrigger>
              <TabsTrigger value="unread">
                {m?.ui?.unread_filter || "Unread"}
                {unreadCount > 0 && (
                  <span className="ms-1 text-xs">({unreadCount})</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="pinned">
                {m?.ui?.pinned_filter || "Pinned"}
                {pinnedCount > 0 && (
                  <span className="ms-1 text-xs">({pinnedCount})</span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}
          >
            <SelectTrigger className="w-[100px]">
              <ListFilter className="h-4 w-4" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {m?.ui?.all_types || "All types"}
              </SelectItem>
              <SelectItem value="direct">
                {m?.types?.direct_short || "Direct"}
              </SelectItem>
              <SelectItem value="group">
                {m?.types?.group_short || "Group"}
              </SelectItem>
              <SelectItem value="class">
                {m?.types?.class_short || "Class"}
              </SelectItem>
              <SelectItem value="department">
                {m?.types?.department_short || "Department"}
              </SelectItem>
              <SelectItem value="announcement">
                {m?.types?.announcement_short || "Announcement"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <ConversationCardSkeleton key={i} />
            ))}
          </div>
        ) : sortedConversations.length === 0 ? (
          searchQuery || filter !== "all" || typeFilter !== "all" ? (
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
          )
        ) : (
          <div className="space-y-1 p-2">
            {sortedConversations.map((conversation) => (
              <ConversationCard
                key={conversation.id}
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
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
