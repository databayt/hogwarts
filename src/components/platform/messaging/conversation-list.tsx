"use client"

import { useState, useEffect } from "react"
import { Search, MessageSquarePlus, ListFilter, LoaderCircle } from "lucide-react"
import type { ConversationDTO, ConversationType } from "./types"
import { ConversationCard, ConversationCardSkeleton } from "./conversation-card"
import { ConversationListEmpty } from "./empty-state"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "unread" | "pinned">("all")
  const [typeFilter, setTypeFilter] = useState<ConversationType | "all">("all")

  // Filter conversations
  const filteredConversations = conversations.filter((conversation) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesTitle = conversation.title?.toLowerCase().includes(query)
      const matchesLastMessage = conversation.lastMessage?.content.toLowerCase().includes(query)

      // For direct conversations, search in participant names
      const matchesParticipant = conversation.type === "direct" &&
        conversation.participants?.some(p =>
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
      const currentParticipant = conversation.participants?.find(p => p.userId === currentUserId)
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
    const aParticipant = a.participants?.find(p => p.userId === currentUserId)
    const bParticipant = b.participants?.find(p => p.userId === currentUserId)

    // Pinned conversations first
    if (aParticipant?.isPinned && !bParticipant?.isPinned) return -1
    if (!aParticipant?.isPinned && bParticipant?.isPinned) return 1

    // Then by last message time
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
    return bTime - aTime
  })

  const unreadCount = conversations.filter(c => (c.unreadCount ?? 0) > 0).length
  const pinnedCount = conversations.filter(c =>
    c.participants?.find(p => p.userId === currentUserId)?.isPinned
  ).length

  return (
    <div className={cn("flex flex-col h-full border-r border-border", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {locale === "ar" ? "الرسائل" : "Messages"}
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={locale === "ar" ? "بحث..." : "Search..."}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="flex-1">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="all">
                {locale === "ar" ? "الكل" : "All"}
              </TabsTrigger>
              <TabsTrigger value="unread">
                {locale === "ar" ? "غير مقروء" : "Unread"}
                {unreadCount > 0 && (
                  <span className="ml-1 text-xs">({unreadCount})</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="pinned">
                {locale === "ar" ? "مثبت" : "Pinned"}
                {pinnedCount > 0 && (
                  <span className="ml-1 text-xs">({pinnedCount})</span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
            <SelectTrigger className="w-[100px]">
              <ListFilter className="h-4 w-4" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{locale === "ar" ? "كل الأنواع" : "All types"}</SelectItem>
              <SelectItem value="direct">{locale === "ar" ? "مباشر" : "Direct"}</SelectItem>
              <SelectItem value="group">{locale === "ar" ? "مجموعة" : "Group"}</SelectItem>
              <SelectItem value="class">{locale === "ar" ? "صف" : "Class"}</SelectItem>
              <SelectItem value="department">{locale === "ar" ? "قسم" : "Department"}</SelectItem>
              <SelectItem value="announcement">{locale === "ar" ? "إعلان" : "Announcement"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-2 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <ConversationCardSkeleton key={i} />
            ))}
          </div>
        ) : sortedConversations.length === 0 ? (
          searchQuery || filter !== "all" || typeFilter !== "all" ? (
            <div className="flex flex-col items-center justify-center h-64 p-4 text-center">
              <Search className="h-8 w-8 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                {locale === "ar" ? "لا توجد محادثات مطابقة" : "No matching conversations"}
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {locale === "ar" ? "جرب كلمات بحث مختلفة" : "Try different search terms"}
              </p>
            </div>
          ) : (
            <ConversationListEmpty
              locale={locale}
              onNewConversation={onNewConversation}
            />
          )
        ) : (
          <div className="p-2 space-y-1">
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
