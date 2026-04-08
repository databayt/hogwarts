"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useDebouncedCallback } from "use-debounce"

import { cn } from "@/lib/utils"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import type { ConversationDTO } from "@/components/school-dashboard/messaging/types"
import type { WhatsAppSessionDTO } from "@/components/school-dashboard/whatsapp/types"

import { getSidebarFilters } from "./config"
import { ContactCard, ContactCardSkeleton } from "./contact-card"
import { ContactSearch } from "./contact-search"
import type { ContactDTO, ContactGroup, SidebarFilter } from "./types"

export interface ContactsPanelProps {
  currentUserRole: string
  conversations: ConversationDTO[]
  currentUserId: string
  locale?: "ar" | "en"
  onContactClick?: (userId: string) => void
  activeContactUserId?: string | null
  whatsappSession?: WhatsAppSessionDTO | null
  /** Map of conversationId → true when someone is typing */
  typingConversations?: Map<string, boolean>
  className?: string
}

export function ContactsPanel({
  currentUserRole,
  conversations,
  currentUserId,
  locale = "en",
  onContactClick,
  activeContactUserId,
  whatsappSession = null,
  typingConversations,
  className,
}: ContactsPanelProps) {
  const { dictionary } = useDictionary()
  const m = dictionary?.messaging
  const [groups, setGroups] = useState<ContactGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<SidebarFilter>("all")

  const filterChips = useMemo(
    () => getSidebarFilters(currentUserRole),
    [currentUserRole]
  )

  // Build userId → conversation map for enrichment
  const convByUser = useMemo(() => {
    const map = new Map<string, ConversationDTO>()
    conversations.forEach((conv) => {
      if (conv.type === "direct") {
        const other = conv.participants?.find((p) => p.userId !== currentUserId)
        if (other) map.set(other.userId, conv)
      }
    })
    return map
  }, [conversations, currentUserId])

  // Cache for initial (no-search) contacts
  const cachedGroupsRef = useRef<ContactGroup[] | null>(null)

  // Fetch contacts with caching for the no-search case
  const fetchContacts = useCallback(
    async (searchQuery?: string) => {
      const isSearch = searchQuery && searchQuery.length >= 2

      // Return cached data immediately for no-search case
      if (!isSearch && cachedGroupsRef.current) {
        setGroups(cachedGroupsRef.current)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const params = new URLSearchParams()
        params.set("locale", locale)
        if (isSearch) {
          params.set("search", searchQuery)
        }
        const res = await fetch(`/api/contacts?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          const newGroups = data.groups ?? []
          setGroups(newGroups)
          if (!isSearch) {
            cachedGroupsRef.current = newGroups
          }
        }
      } catch (error) {
        console.error("[ContactsPanel] Error fetching contacts:", error)
      } finally {
        setIsLoading(false)
      }
    },
    [locale]
  )

  // Initial load
  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  // Debounced search
  const debouncedSearch = useDebouncedCallback((value: string) => {
    fetchContacts(value)
  }, 300)

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value)
      debouncedSearch(value)
    },
    [debouncedSearch]
  )

  // Flatten all contacts and enrich with conversation data
  const allContacts = useMemo(() => {
    const flat: ContactDTO[] = []
    for (const group of groups) {
      for (const contact of group.contacts) {
        const conv = convByUser.get(contact.id)
        const participant = conv?.participants?.find(
          (p) => p.userId === currentUserId
        )
        flat.push({
          ...contact,
          conversationId: conv?.id,
          lastMessage: conv?.lastMessage?.content ?? null,
          lastMessageAt: conv?.lastMessageAt ?? null,
          lastMessageContentType: conv?.lastMessage?.contentType ?? null,
          lastMessageHasAttachments:
            (conv?.lastMessage?.attachments?.length ?? 0) > 0,
          unreadCount: conv?.unreadCount ?? 0,
          isPinned: participant?.isPinned ?? false,
          isMuted: participant?.isMuted ?? false,
          isTyping: conv?.id
            ? (typingConversations?.get(conv.id) ?? false)
            : false,
        })
      }
    }

    // Dedup by user ID (a contact may appear in multiple categories)
    const seen = new Set<string>()
    return flat.filter((c) => {
      if (seen.has(c.id)) return false
      seen.add(c.id)
      return true
    })
  }, [groups, convByUser, currentUserId, typingConversations])

  // Filter contacts
  const filteredContacts = useMemo(() => {
    let result = allContacts

    if (activeFilter === "unread") {
      result = result.filter((c) => (c.unreadCount ?? 0) > 0)
    } else if (activeFilter === "favourites") {
      result = result.filter((c) => c.isPinned)
    } else if (activeFilter !== "all") {
      // Role category filter
      result = result.filter((c) => c.category === activeFilter)
    }

    return result
  }, [allContacts, activeFilter])

  // Sort: contacts with conversations first (by lastMessageAt desc), then alphabetical
  const sortedContacts = useMemo(() => {
    return [...filteredContacts].sort((a, b) => {
      // Pinned first
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1

      // Then by conversation activity
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
      if (aTime !== bTime) return bTime - aTime

      // Then alphabetical
      return a.displayName.localeCompare(b.displayName)
    })
  }, [filteredContacts])

  // Unread count for badge
  const unreadCount = useMemo(
    () => allContacts.filter((c) => (c.unreadCount ?? 0) > 0).length,
    [allContacts]
  )

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      {/* Search + filters */}
      <div className="shrink-0">
        <ContactSearch
          search={search}
          onSearchChange={handleSearchChange}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          filterChips={filterChips}
          unreadCount={unreadCount}
          locale={locale}
          whatsappSession={whatsappSession}
        />
      </div>

      {/* Contact list */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6">
        {isLoading ? (
          <div>
            {Array.from({ length: 8 }).map((_, i) => (
              <ContactCardSkeleton key={i} />
            ))}
          </div>
        ) : sortedContacts.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center p-4 text-center">
            <p className="text-muted-foreground">
              {search
                ? m?.contacts?.no_results || "No contacts found"
                : activeFilter === "unread"
                  ? m?.contacts?.no_unread || "No unread messages"
                  : activeFilter === "favourites"
                    ? m?.contacts?.no_favourites || "No favourites yet"
                    : m?.contacts?.no_contacts || "No contacts available"}
            </p>
          </div>
        ) : (
          <div>
            {sortedContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                locale={locale}
                isActive={contact.id === activeContactUserId}
                onClick={onContactClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
