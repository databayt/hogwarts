"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { cn } from "@/lib/utils"
import socketService from "@/lib/websocket/socket-service"
import { toast } from "@/components/ui/use-toast"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import type { WhatsAppSessionDTO } from "../whatsapp/types"
import {
  addReaction,
  createConversation,
  deleteMessage,
  editMessage,
  fetchConversationData,
  loadMoreMessages,
  markConversationAsRead,
  pollConversationUpdates,
  pollNewMessages,
  removeReaction,
  sendMessage,
} from "./actions"
import { ChatInterface } from "./chat-interface"
import { ContactsPanel } from "./contacts/contacts-panel"
import { ConversationInfoPanel } from "./conversation-info-panel"
import { NoActiveConversation } from "./empty-state"
import { resolveMessagingError } from "./errors"
import { usePresence } from "./hooks"
import { IosChatList } from "./mobile"
import type { ConversationDTO, MessageAttachmentDTO, MessageDTO } from "./types"

// Build a MessageDTO from Socket.IO event data
export function buildMessageFromSocket(data: {
  id: string
  conversationId: string
  senderId: string
  content: string
  contentType: string
  createdAt: string
  metadata?: Record<string, unknown> | null
  sender?: {
    id: string
    username: string | null
    email: string | null
    image: string | null
  }
  replyToId?: string | null
  attachments?: Array<{
    id: string
    url: string
    fileName: string
    fileSize: number
    fileType: string
    thumbnail?: string | null
  }>
}): MessageDTO {
  return {
    id: data.id,
    conversationId: data.conversationId,
    senderId: data.senderId,
    sender: data.sender ?? {
      id: data.senderId,
      username: null,
      email: null,
      image: null,
    },
    content: data.content,
    contentType: (data.contentType || "text") as MessageDTO["contentType"],
    status: "sent",
    replyToId: data.replyToId ?? null,
    replyTo: null,
    forwardedFromId: null,
    isEdited: false,
    editedAt: null,
    isDeleted: false,
    deletedAt: null,
    isSystem: false,
    metadata: data.metadata ?? null,
    whatsappStatus: null,
    whatsappPhone: null,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.createdAt),
    attachments: (data.attachments ?? []).map(
      (a) =>
        ({
          id: a.id,
          messageId: data.id,
          url: a.url,
          fileUrl: a.url,
          name: a.fileName,
          fileName: a.fileName,
          size: a.fileSize,
          fileSize: a.fileSize,
          fileType: a.fileType,
          thumbnail: a.thumbnail ?? null,
          uploadedAt: new Date(data.createdAt),
        }) as MessageAttachmentDTO
    ),
    reactions: [],
    readReceipts: [],
    readCount: 0,
  }
}

// --- Conversation cache types ---

type ConversationState = {
  messages: MessageDTO[]
  hasMore: boolean
  scrollPosition: number
  lastFetchedAt: number
  lastMessageId: string | null // last non-temp message ID for gap-fill
}

const CACHE_TTL = 60_000 // 1 minute

// Get last non-temp message ID from a message array (for gap-fill cursors)
function getLastRealMessageId(messages: MessageDTO[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (!messages[i].id.startsWith("temp-")) return messages[i].id
  }
  return null
}

export interface MessagingClientProps {
  initialConversations: ConversationDTO[]
  initialActiveConversation: ConversationDTO | null
  initialMessages: MessageDTO[]
  currentUserId: string
  currentUserRole: string
  locale?: "ar" | "en"
  whatsappConnected?: boolean
  whatsappSession?: WhatsAppSessionDTO | null
}

export function MessagingClient({
  initialConversations,
  initialActiveConversation,
  initialMessages,
  currentUserId,
  currentUserRole,
  locale = "en",
  whatsappConnected = false,
  whatsappSession = null,
}: MessagingClientProps) {
  const { dictionary } = useDictionary()
  const m = dictionary?.messaging
  const [conversations, setConversations] =
    useState<ConversationDTO[]>(initialConversations)
  const [activeConversation, setActiveConversation] =
    useState<ConversationDTO | null>(initialActiveConversation)
  const [isConnected, setIsConnected] = useState(false)
  const [showInfoPanel, setShowInfoPanel] = useState(false)
  // Typing indicators across all conversations (for sidebar)
  const [typingConversations, setTypingConversations] = useState<
    Map<string, boolean>
  >(new Map())
  // Re-render trigger for cache-derived state
  const [, setRenderTick] = useState(0)

  // --- Conversation message cache ---
  const cacheRef = useRef<Map<string, ConversationState>>(new Map())

  // Seed cache with initial data on mount
  const seededRef = useRef(false)
  if (!seededRef.current && initialActiveConversation) {
    cacheRef.current.set(initialActiveConversation.id, {
      messages: initialMessages,
      hasMore: initialMessages.length >= 50,
      scrollPosition: -1,
      lastFetchedAt: Date.now(),
      lastMessageId: getLastRealMessageId(initialMessages),
    })
    seededRef.current = true
  }

  // Derive messages and hasMore from cache
  const activeState = activeConversation
    ? cacheRef.current.get(activeConversation.id)
    : null
  const messages = activeState?.messages ?? []
  const hasMoreMessages = activeState?.hasMore ?? false

  // Helper to update cached messages — only triggers render for active conversation
  const updateCachedMessages = useCallback(
    (convId: string, updater: (prev: MessageDTO[]) => MessageDTO[]) => {
      const state = cacheRef.current.get(convId)
      if (state) {
        state.messages = updater(state.messages)
        state.lastMessageId = getLastRealMessageId(state.messages)
        if (convId === activeConversation?.id) {
          setRenderTick((t) => t + 1)
        }
      }
    },
    [activeConversation?.id]
  )

  // Helper to update cache hasMore
  const updateCachedHasMore = useCallback(
    (convId: string, hasMore: boolean) => {
      const state = cacheRef.current.get(convId)
      if (state) {
        state.hasMore = hasMore
        if (convId === activeConversation?.id) {
          setRenderTick((t) => t + 1)
        }
      }
    },
    [activeConversation?.id]
  )

  // Sync conversations list with server props on navigation
  useEffect(() => {
    setConversations(initialConversations)
  }, [initialConversations])

  // Sync active conversation from server props (e.g. router.refresh)
  const prevActiveId = useRef(initialActiveConversation?.id)
  useEffect(() => {
    if (initialActiveConversation?.id !== prevActiveId.current) {
      prevActiveId.current = initialActiveConversation?.id
      setActiveConversation(initialActiveConversation)
      if (initialActiveConversation) {
        cacheRef.current.set(initialActiveConversation.id, {
          messages: initialMessages,
          hasMore: initialMessages.length >= 50,
          scrollPosition: -1,
          lastFetchedAt: Date.now(),
          lastMessageId: getLastRealMessageId(initialMessages),
        })
        setRenderTick((t) => t + 1)
      }
    }
  }, [initialActiveConversation, initialMessages])

  // Derive active contact userId for sidebar highlight
  const activeContactUserId = activeConversation?.participants?.find(
    (p) => p.userId !== currentUserId
  )?.userId

  // Track every "other" participant's presence so the mobile sidebar can show
  // online dots. Renders only once the Socket.IO server is live (#262); until
  // then onlineUserIds stays empty (same as no presence) — no behavior change.
  const trackedUserIds = useMemo(() => {
    const ids = new Set<string>()
    for (const conv of conversations) {
      for (const p of conv.participants ?? []) {
        if (p.userId !== currentUserId) ids.add(p.userId)
      }
    }
    return Array.from(ids)
  }, [conversations, currentUserId])
  const { presenceMap } = usePresence(trackedUserIds)
  const onlineUserIds = useMemo(() => {
    const online = new Set<string>()
    presenceMap.forEach((status, id) => {
      if (status.state === "online") online.add(id)
    })
    return online
  }, [presenceMap])

  // --- Socket.IO connection (reactive) ---
  useEffect(() => {
    setIsConnected(socketService.isConnected())

    const unsubscribe = socketService.onConnectionChange(async (connected) => {
      setIsConnected(connected)
      if (connected) {
        socketService.subscribeToConversations(currentUserId)

        // Gap-fill: fetch messages missed during disconnect
        // Active conversation: fetch new messages after the last known ID
        const activeId = activeConversation?.id
        if (activeId) {
          const cached = cacheRef.current.get(activeId)
          if (cached?.lastMessageId) {
            try {
              const result = await pollNewMessages({
                conversationId: activeId,
                afterMessageId: cached.lastMessageId,
              })
              if (result.success && result.data.items.length > 0) {
                const existingIds = new Set(cached.messages.map((m) => m.id))
                const newMsgs = result.data.items.filter(
                  (m: MessageDTO) => !existingIds.has(m.id)
                )
                if (newMsgs.length > 0) {
                  cached.messages = [...cached.messages, ...newMsgs]
                  cached.lastMessageId = getLastRealMessageId(cached.messages)
                  setRenderTick((t) => t + 1)
                }
              }
            } catch {
              // Gap-fill is best-effort
            }
          }
        }

        // Background conversations: mark stale so they refetch on next switch
        for (const [convId, state] of cacheRef.current.entries()) {
          if (convId !== activeId) {
            state.lastFetchedAt = 0
          }
        }
      }
    })

    if (socketService.isConnected()) {
      socketService.subscribeToConversations(currentUserId)
    }

    return () => {
      unsubscribe()
      socketService.unsubscribeFromConversations(currentUserId)
    }
  }, [currentUserId])

  // Polling fallback for conversation list when Socket.IO unavailable
  useEffect(() => {
    if (isConnected) return

    let active = true
    const poll = async () => {
      if (!active) return
      const result = await pollConversationUpdates()
      if (result.success) {
        setConversations(result.data.conversations)
      }
    }

    const timer = setInterval(poll, 15000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [isConnected])

  // Active-conversation message polling lives in ChatInterface (the component
  // that owns the open thread + markAsRead). It feeds updateCachedMessages,
  // which keeps this cache's lastMessageId in sync — so no duplicate poller
  // here. Only the conversation-list poll (above) runs at this level.

  // Listen for conversation + message updates via Socket.IO
  useEffect(() => {
    if (!isConnected) return

    const unsubscribeConversationNew = socketService.on(
      "conversation:new",
      (data) => {
        setConversations((prev) => [
          {
            id: data.id,
            schoolId: "",
            type: data.type as ConversationDTO["type"],
            title: data.title,
            avatar: null,
            directParticipant1Id: null,
            directParticipant2Id: null,
            lastMessageAt: new Date(),
            isArchived: false,
            whatsappEnabled: false,
            participantCount: data.participantIds.length,
            unreadCount: 0,
            lastMessage: null,
            participants: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          ...prev,
        ])
      }
    )

    const unsubscribeConversationUpdated = socketService.on(
      "conversation:updated",
      (data) => {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === data.conversationId
              ? { ...conv, ...data.updates }
              : conv
          )
        )
      }
    )

    // Sidebar instant update: when any message arrives, update conversation list
    const unsubscribeMessageNew = socketService.on("message:new", (data) => {
      const newMsg = buildMessageFromSocket(data)

      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv.id !== data.conversationId) return conv
          return {
            ...conv,
            lastMessageAt: new Date(data.createdAt),
            lastMessage: newMsg,
            unreadCount:
              conv.id === activeConversation?.id
                ? conv.unreadCount
                : conv.unreadCount + (data.senderId !== currentUserId ? 1 : 0),
          }
        })
        return updated.sort(
          (a, b) =>
            new Date(b.lastMessageAt).getTime() -
            new Date(a.lastMessageAt).getTime()
        )
      })

      // Also update message cache for background conversations
      if (data.conversationId !== activeConversation?.id) {
        const cached = cacheRef.current.get(data.conversationId)
        if (cached) {
          const exists = cached.messages.some((msg) => msg.id === data.id)
          if (!exists) {
            cached.messages = [...cached.messages, newMsg]
            cached.lastMessageId = data.id
          }
        }
      }
    })

    // Typing indicators for sidebar — listen globally
    const unsubscribeTypingStart = socketService.on("typing:start", (data) => {
      if (data.userId !== currentUserId) {
        setTypingConversations((prev) => {
          const next = new Map(prev)
          next.set(data.conversationId, true)
          return next
        })
      }
    })

    const unsubscribeTypingStop = socketService.on("typing:stop", (data) => {
      setTypingConversations((prev) => {
        if (!prev.has(data.conversationId)) return prev
        const next = new Map(prev)
        next.delete(data.conversationId)
        return next
      })
    })

    return () => {
      unsubscribeConversationNew()
      unsubscribeConversationUpdated()
      unsubscribeMessageNew()
      unsubscribeTypingStart()
      unsubscribeTypingStop()
    }
  }, [isConnected, activeConversation?.id, currentUserId])

  // Keep stable refs to frequently-changing values used inside handlers so
  // we can keep useCallback dep arrays minimal while avoiding stale closures.
  const activeConversationRef = useRef(activeConversation)
  useEffect(() => {
    activeConversationRef.current = activeConversation
  }, [activeConversation])

  const messagesRef = useRef(messages)
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const conversationsRef = useRef(conversations)
  useEffect(() => {
    conversationsRef.current = conversations
  }, [conversations])

  // Dictionary ref so handlers can read m without depending on it in dep arrays
  const mRef = useRef(m)
  useEffect(() => {
    mRef.current = m
  }, [m])

  const handleBack = useCallback(() => {
    // Save scroll position before leaving
    const conv = activeConversationRef.current
    if (conv) {
      const cached = cacheRef.current.get(conv.id)
      if (cached) {
        cached.scrollPosition = -1
      }
    }
    setActiveConversation(null)
    setShowInfoPanel(false)
    window.history.replaceState(null, "", `/${locale}/messages`)
  }, [locale])

  const handleSendMessage = useCallback(
    async (content: string, replyToId?: string): Promise<MessageDTO | void> => {
      const conv = activeConversationRef.current
      if (!conv) return

      const result = await sendMessage({
        conversationId: conv.id,
        content,
        contentType: "text",
        replyToId,
      })

      if (!result.success) {
        throw new Error(resolveMessagingError(result.error, mRef.current))
      }

      return result.data.message as MessageDTO
    },
    []
  )

  const handleEditMessage = useCallback(
    async (messageId: string, content: string) => {
      const result = await editMessage({ messageId, content })
      if (!result.success) {
        throw new Error(resolveMessagingError(result.error, mRef.current))
      }
    },
    []
  )

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    const result = await deleteMessage({ messageId })
    if (!result.success) {
      throw new Error(resolveMessagingError(result.error, mRef.current))
    }
  }, [])

  const handleReactToMessage = useCallback(
    async (messageId: string, emoji: string) => {
      const result = await addReaction({ messageId, emoji })
      if (!result.success) {
        throw new Error(resolveMessagingError(result.error, mRef.current))
      }
    },
    []
  )

  const handleRemoveReaction = useCallback(async (reactionId: string) => {
    const result = await removeReaction({ reactionId })
    if (!result.success) {
      throw new Error(resolveMessagingError(result.error, mRef.current))
    }
  }, [])

  const switchToConversation = useCallback(
    async (conversationId: string) => {
      // Check cache first
      const cached = cacheRef.current.get(conversationId)
      if (cached && Date.now() - cached.lastFetchedAt < CACHE_TTL) {
        // Cache hit — instant switch
        const conv = conversationsRef.current.find(
          (c) => c.id === conversationId
        )
        if (conv) {
          setActiveConversation(conv)
          setRenderTick((t) => t + 1)
          window.history.replaceState(
            null,
            "",
            `/${locale}/messages?conversation=${conversationId}`
          )
          return
        }
      }

      // Cache miss or stale — fetch from server
      const result = await fetchConversationData({ conversationId })
      if (result.success) {
        setActiveConversation(result.data.conversation)
        cacheRef.current.set(conversationId, {
          messages: result.data.messages,
          hasMore: result.data.hasMore,
          scrollPosition: -1,
          lastFetchedAt: Date.now(),
          lastMessageId: getLastRealMessageId(result.data.messages),
        })
        setRenderTick((t) => t + 1)
        window.history.replaceState(
          null,
          "",
          `/${locale}/messages?conversation=${conversationId}`
        )
      }
    },
    [locale]
  )

  const handleContactClick = useCallback(
    async (userId: string) => {
      const currentM = mRef.current
      try {
        const result = await createConversation({
          type: "direct",
          participantIds: [userId],
        })
        if (result.success) {
          await switchToConversation(result.data.id)
        } else {
          toast({
            title: currentM?.notifications?.error || "Error",
            description: resolveMessagingError(
              "error" in result ? result.error : undefined,
              currentM
            ),
          })
        }
      } catch {
        toast({
          title: currentM?.notifications?.error || "Error",
          description:
            currentM?.errors?.conversation_start_failed ||
            "Failed to start conversation",
        })
      }
    },
    [switchToConversation]
  )

  const handleLoadMoreMessages = useCallback(async () => {
    const conv = activeConversationRef.current
    const currentMessages = messagesRef.current
    if (!conv || currentMessages.length === 0) return
    const oldestMessage = currentMessages[0]
    const result = await loadMoreMessages({
      conversationId: conv.id,
      cursor: oldestMessage.id,
      take: 50,
      direction: "before",
    })
    if (result.success) {
      updateCachedMessages(conv.id, (prev) => [...result.data.items, ...prev])
      updateCachedHasMore(conv.id, result.data.hasMore)
    }
  }, [updateCachedMessages, updateCachedHasMore])

  // Save scroll position from ChatInterface
  const handleSaveScrollPosition = useCallback(
    (position: number) => {
      if (activeConversation) {
        const cached = cacheRef.current.get(activeConversation.id)
        if (cached) {
          cached.scrollPosition = position
        }
      }
    },
    [activeConversation?.id]
  )

  return (
    <div className="bg-msg-chat-bg relative flex h-full">
      {/* Mobile (<md) — iOS WhatsApp chat list when no active conversation */}
      <div
        className={cn(
          "md:hidden",
          activeConversation ? "hidden" : "flex h-full w-full"
        )}
      >
        <IosChatList
          conversations={conversations}
          currentUserId={currentUserId}
          activeConversationId={activeConversation?.id ?? null}
          typingConversations={typingConversations}
          onlineUserIds={onlineUserIds}
          onConversationClick={switchToConversation}
          locale={locale}
          labels={{
            titleChats: m?.ui?.title ?? "Chats",
            searchPlaceholder: m?.ui?.search_placeholder ?? "Search messages",
            filterAll: m?.ui?.filter?.all ?? "All",
            filterUnread: m?.ui?.filter?.unread ?? "Unread",
            filterFavourites: m?.ui?.filter?.favourites ?? "Favourites",
            filterGroups: m?.ui?.filter?.groups ?? "Groups",
            archivedLabel: m?.ui?.archived ?? "Archived",
            tabCalls: m?.ui?.tab?.calls ?? "Calls",
            tabClasses: m?.ui?.tab?.classes ?? "Classes",
            tabChats: m?.ui?.tab?.chats ?? "Chats",
            tabBack: m?.ui?.tab?.back ?? "Back",
            encryptPrefix: m?.ui?.encrypt?.prefix ?? "Your personal",
            encryptTopic: m?.ui?.encrypt?.topic_messages ?? "messages",
            encryptSuffix: m?.ui?.encrypt?.suffix ?? "are",
            typingPreview: m?.ui?.typing ?? "typing...",
            previewPhoto: m?.ui?.preview?.photo ?? "Photo",
            previewVideo: m?.ui?.preview?.video ?? "Video",
            previewVoice: m?.ui?.preview?.voice ?? "Voice message",
            previewLocation: m?.ui?.preview?.location ?? "Location",
            previewDeleted:
              m?.ui?.preview?.deleted ?? "You deleted this message.",
            relativeYesterday: m?.ui?.relative_yesterday ?? "Yesterday",
          }}
        />
      </div>

      {/* Sidebar — desktop-only contact list (md+) */}
      <div
        className={cn(
          "bg-msg-sidebar-bg border-border hidden min-h-0 flex-shrink-0 flex-col overflow-hidden border-e",
          "md:flex md:w-[350px] md:max-w-[30vw]"
        )}
      >
        <ContactsPanel
          currentUserRole={currentUserRole}
          conversations={conversations}
          currentUserId={currentUserId}
          locale={locale}
          onContactClick={handleContactClick}
          activeContactUserId={activeContactUserId}
          whatsappSession={whatsappSession}
          typingConversations={typingConversations}
        />
      </div>

      {/* Chat area — hidden on mobile when no conversation */}
      <div
        className={cn(
          "flex flex-1 flex-col",
          !activeConversation ? "hidden md:flex" : "flex"
        )}
      >
        {activeConversation ? (
          <ChatInterface
            conversation={activeConversation}
            messages={messages}
            hasMoreMessages={hasMoreMessages}
            currentUserId={currentUserId}
            locale={locale}
            isConnected={isConnected}
            whatsappConnected={whatsappConnected}
            onSendMessage={handleSendMessage}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onReactToMessage={handleReactToMessage}
            onRemoveReaction={handleRemoveReaction}
            onLoadMoreMessages={handleLoadMoreMessages}
            onMessagesUpdate={updateCachedMessages}
            onBack={handleBack}
            onViewDetails={() => setShowInfoPanel(!showInfoPanel)}
            onViewParticipants={() => setShowInfoPanel(true)}
            onSaveScrollPosition={handleSaveScrollPosition}
            savedScrollPosition={activeState?.scrollPosition ?? -1}
          />
        ) : (
          <NoActiveConversation locale={locale} />
        )}
      </div>

      {/* Info panel — slide-in from end */}
      {showInfoPanel && activeConversation && (
        <div className="border-border hidden border-s md:block">
          <ConversationInfoPanel
            conversation={activeConversation}
            currentUserId={currentUserId}
            locale={locale}
            onClose={() => setShowInfoPanel(false)}
          />
        </div>
      )}
    </div>
  )
}
