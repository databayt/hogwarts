"use client"

import { useMemo, useState } from "react"

import type { ConversationDTO } from "@/components/school-dashboard/messaging/types"

import { IosArchivedRow } from "./ios-archived-row"
import { IosChatRow, type IosChatRowData } from "./ios-chat-row"
import type { FilterId } from "./ios-filter-chips"
import { IosHeader } from "./ios-header"
import { IosInfoEncrypt } from "./ios-info-encrypt"
import { IosTabbar, type IosTab, type IosTabId } from "./ios-tabbar"
import { IosTitleBlock } from "./ios-title-block"

type L = {
  titleChats: string
  searchPlaceholder: string
  filterAll: string
  filterUnread: string
  filterFavourites: string
  filterGroups: string
  archivedLabel: string
  tabCalls: string
  tabClasses: string
  tabChats: string
  tabBack: string
  encryptPrefix: string
  encryptTopic: string
  encryptSuffix: string
  typingPreview: string
  groupFallbackName: string
  directFallbackName: string
  previewPhoto: string
  previewVideo: string
  previewVoice: string
  previewLocation: string
  previewDeleted: string
  relativeYesterday: string
}

const DEFAULT_L: L = {
  titleChats: "Chats",
  searchPlaceholder: "Search messages",
  filterAll: "All",
  filterUnread: "Unread",
  filterFavourites: "Favourites",
  filterGroups: "Groups",
  archivedLabel: "Archived",
  tabCalls: "Calls",
  tabClasses: "Classes",
  tabChats: "Chats",
  tabBack: "Back",
  encryptPrefix: "Your personal",
  encryptTopic: "messages",
  encryptSuffix: "are",
  typingPreview: "is typing...",
  groupFallbackName: "Group",
  directFallbackName: "Unknown",
  previewPhoto: "Photo",
  previewVideo: "Video",
  previewVoice: "Voice message",
  previewLocation: "Location",
  previewDeleted: "You deleted this message.",
  relativeYesterday: "Yesterday",
}

type Props = {
  conversations: ConversationDTO[]
  currentUserId: string
  activeConversationId?: string | null
  typingConversations?: Map<string, boolean>
  mentionedConversations?: Set<string>
  onlineUserIds?: Set<string>
  onConversationClick: (id: string) => void
  onNewChat?: () => void
  onCamera?: () => void
  onOptions?: () => void
  onOpenArchived?: () => void
  onDashboard?: () => void
  locale?: "ar" | "en"
  labels?: Partial<L>
}

export function IosChatList({
  conversations,
  currentUserId,
  activeConversationId,
  typingConversations,
  mentionedConversations,
  onlineUserIds,
  onConversationClick,
  onNewChat,
  onCamera,
  onOptions,
  onOpenArchived,
  onDashboard,
  locale = "en",
  labels,
}: Props) {
  const L = { ...DEFAULT_L, ...labels }
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterId>("all")
  const [activeTab, setActiveTab] = useState<IosTabId>("chats")

  const filters = useMemo(
    () => [
      { id: "all" as FilterId, label: L.filterAll },
      { id: "unread" as FilterId, label: L.filterUnread },
      { id: "favourites" as FilterId, label: L.filterFavourites },
      { id: "groups" as FilterId, label: L.filterGroups },
    ],
    [L.filterAll, L.filterUnread, L.filterFavourites, L.filterGroups]
  )

  const totalUnread = useMemo(
    () => conversations.reduce((n, c) => n + (c.unreadCount ?? 0), 0),
    [conversations]
  )

  const tabs: IosTab[] = [
    { id: "calls", label: L.tabCalls, icon: "ic-wa-tab-calls-32" },
    {
      id: "communities",
      label: L.tabClasses,
      icon: "ic-wa-tab-communities-32",
    },
    {
      id: "chats",
      label: L.tabChats,
      icon: "ic-wa-tab-chats-32",
      badge: totalUnread,
    },
    { id: "settings", label: L.tabBack, icon: "ic-wa-tab-settings-32" },
  ]

  const { active: activeConvs, archived: archivedCount } = useMemo(() => {
    const active: ConversationDTO[] = []
    let archived = 0
    for (const c of conversations) {
      if (c.isArchived) archived++
      else active.push(c)
    }
    return { active, archived }
  }, [conversations])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return activeConvs
      .filter((c) => {
        if (activeFilter === "unread" && (c.unreadCount ?? 0) === 0)
          return false
        if (activeFilter === "groups" && c.type !== "group") return false
        if (activeFilter === "favourites") {
          const self = c.participants?.find((p) => p.userId === currentUserId)
          if (!self?.isPinned) return false
        }
        if (!q) return true
        const name = getConversationName(c, currentUserId, L)
        return name.toLowerCase().includes(q)
      })
      .sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime()
      )
  }, [activeConvs, activeFilter, search, currentUserId, L])

  const rowsData = useMemo(
    () =>
      filtered.map((c) =>
        toRowData(
          c,
          currentUserId,
          typingConversations,
          mentionedConversations,
          onlineUserIds,
          L,
          locale
        )
      ),
    [
      filtered,
      currentUserId,
      typingConversations,
      mentionedConversations,
      onlineUserIds,
      L,
      locale,
    ]
  )

  const handleTabChange = (id: IosTabId) => {
    if (id === "settings") {
      onDashboard?.()
      return
    }
    setActiveTab(id)
  }

  return (
    <div className="relative flex h-full w-full flex-col bg-[color:var(--wa-surface-primary)]">
      <IosHeader
        showOptions
        showCamera
        showAdd
        onOptions={onOptions}
        onCamera={onCamera}
        onAdd={onNewChat}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <IosTitleBlock
          title={L.titleChats}
          searchPlaceholder={L.searchPlaceholder}
          searchValue={search}
          onSearchChange={setSearch}
          filters={filters}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        <div className="flex flex-col items-start">
          <IosArchivedRow
            label={L.archivedLabel}
            count={archivedCount > 0 ? archivedCount : undefined}
            onClick={onOpenArchived}
          />

          {rowsData.map((row) => (
            <IosChatRow
              key={row.id}
              row={row}
              onClick={() => onConversationClick(row.id)}
            />
          ))}
        </div>

        <div className="pt-[18px] pb-[32px]">
          <IosInfoEncrypt
            prefix={L.encryptPrefix}
            topic={L.encryptTopic}
            suffix={L.encryptSuffix}
          />
        </div>
      </div>

      <IosTabbar tabs={tabs} active={activeTab} onChange={handleTabChange} />
    </div>
  )
}

function getConversationName(
  c: ConversationDTO,
  currentUserId: string,
  L: L
): string {
  if (c.title) return c.title
  if (c.type === "direct") {
    const other = c.participants?.find((p) => p.userId !== currentUserId)
    return (
      other?.nickname ||
      other?.user.username ||
      other?.user.email ||
      L.directFallbackName
    )
  }
  return L.groupFallbackName
}

function getAvatarUrl(
  c: ConversationDTO,
  currentUserId: string
): string | null {
  if (c.avatar) return c.avatar
  if (c.type === "direct") {
    const other = c.participants?.find((p) => p.userId !== currentUserId)
    return other?.user.image ?? null
  }
  return null
}

function formatTimestamp(
  d: Date | string,
  locale: "ar" | "en",
  yesterdayLabel: string
): string {
  const date = typeof d === "string" ? new Date(d) : d
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  if (sameDay) {
    return date.toLocaleTimeString(locale === "ar" ? "ar-EG" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return yesterdayLabel
  }
  return date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    day: "2-digit",
    month: "2-digit",
  })
}

function toRowData(
  c: ConversationDTO,
  currentUserId: string,
  typing: Map<string, boolean> | undefined,
  mentioned: Set<string> | undefined,
  online: Set<string> | undefined,
  L: L,
  locale: "ar" | "en"
): IosChatRowData {
  const self = c.participants?.find((p) => p.userId === currentUserId)
  const isGroup = c.type !== "direct"
  const last = c.lastMessage
  const isTyping = typing?.get(c.id) ?? false
  const isMentioned = mentioned?.has(c.id) ?? false
  const otherUser =
    c.type === "direct"
      ? c.participants?.find((p) => p.userId !== currentUserId)
      : null
  const isOnline = otherUser ? (online?.has(otherUser.userId) ?? false) : false

  let previewLeading: IosChatRowData["previewLeading"] = null
  let previewText = ""
  let previewItalic = false

  if (isTyping) {
    previewText = L.typingPreview
    previewItalic = true
  } else if (last?.isDeleted) {
    previewText = L.previewDeleted
    previewLeading = "deleted"
    previewItalic = true
  } else if (last) {
    const isMine = last.senderId === currentUserId
    if (last.contentType === "voice" || last.contentType === "audio") {
      previewLeading = "voice"
      previewText = L.previewVoice
    } else if (last.contentType === "location") {
      previewLeading = "location"
      previewText = L.previewLocation
    } else if (last.contentType === "image") {
      previewText = L.previewPhoto
    } else if (last.contentType === "video") {
      previewText = L.previewVideo
    } else {
      previewText = last.content || ""
    }
    if (isMine) {
      previewLeading = last.status === "read" ? "check-read" : "check-sent"
    }
  }

  return {
    id: c.id,
    name: getConversationName(c, currentUserId, L),
    avatarUrl: getAvatarUrl(c, currentUserId),
    isGroup,
    online: isOnline,
    preview: previewText,
    previewLeading,
    previewItalic,
    timestamp: formatTimestamp(c.lastMessageAt, locale, L.relativeYesterday),
    unreadCount: c.unreadCount,
    mentioned: isMentioned,
    pinned: self?.isPinned ?? false,
    muted: self?.isMuted ?? false,
  }
}
