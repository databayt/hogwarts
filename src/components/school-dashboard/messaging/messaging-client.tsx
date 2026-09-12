"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"

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
  pollConversationUpdates,
  pollNewMessages,
  removeReaction,
  sendMessage,
} from "./actions"
import type { DesktopViewProps } from "./desktop-view"
import { resolveMessagingError } from "./errors"
import {
  useLayoutMode,
  usePresence,
  useThreadSync,
  type LayoutMode,
} from "./hooks"
import type { MessagesViewLabels } from "./mobile"
import {
  conversationAvatar,
  conversationTitle,
  toChatItems,
  type AdaptLabels,
} from "./mobile/chat/adapt"
import type { MobileViewProps } from "./mobile-view"
import {
  buildMessageFromSocket,
  isTempId,
  mergeServerMessages,
  nonceOf,
  tempIdFor,
} from "./socket-message"
import type { ConversationDTO, MessageAttachmentDTO, MessageDTO } from "./types"

export { buildMessageFromSocket } from "./socket-message"

// One tree per width. Each is its own chunk: a phone never downloads the
// split-pane, a desktop never downloads the five-tab shell, and neither
// runs the other's effects behind a `display: none`.
const DesktopView = dynamic(
  () => import("./desktop-view").then((m) => m.DesktopView),
  { ssr: true }
)
const MobileView = dynamic(
  () => import("./mobile-view").then((m) => m.MobileView),
  { ssr: true }
)

// --- Conversation cache types ---

type ConversationState = {
  messages: MessageDTO[]
  hasMore: boolean
  scrollPosition: number
  lastFetchedAt: number
  lastMessageId: string | null // last non-temp message ID for gap-fill
}

const CACHE_TTL = 60_000 // 1 minute
/** The list poll, only while the socket is down. */
const LIST_POLL_MS = 15_000
/** Every Nth list tick refetches everything, catching what no row-change reveals. */
const LIST_FULL_EVERY = 8
/** A failed send is retried this many times before it stays failed. */
const MAX_SEND_ATTEMPTS = 3
/** Typing indicators the other side never closed expire after this. */
const TYPING_TTL_MS = 5_000
const DRAFTS_KEY = "messaging:drafts"

// Get last non-temp message ID from a message array (for gap-fill cursors)
function getLastRealMessageId(messages: MessageDTO[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (!isTempId(messages[i].id)) return messages[i].id
  }
  return null
}

function byNewestFirst(a: ConversationDTO, b: ConversationDTO) {
  return (
    new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  )
}

function readDrafts(): Map<string, string> {
  try {
    const raw = sessionStorage.getItem(DRAFTS_KEY)
    if (!raw) return new Map()
    return new Map(Object.entries(JSON.parse(raw) as Record<string, string>))
  } catch {
    return new Map()
  }
}

function writeDrafts(drafts: Map<string, string>) {
  try {
    sessionStorage.setItem(DRAFTS_KEY, JSON.stringify(Object.fromEntries(drafts)))
  } catch {
    // Storage may be unavailable; drafts then live for the session only.
  }
}

export interface MessagingClientProps {
  initialConversations: ConversationDTO[]
  initialActiveConversation: ConversationDTO | null
  initialMessages: MessageDTO[]
  currentUserId: string
  currentUserRole: string
  schoolId: string
  /** The server's guess at which tree to render; corrected after mount. */
  initialLayout: LayoutMode
  /** When the server took its snapshot — the first list poll's `since`. */
  initialServerTime?: string
  locale?: "ar" | "en"
  whatsappConnected?: boolean
  whatsappSession?: WhatsAppSessionDTO | null
  /** The school, shown as the one community on the mobile Communities tab. */
  schoolName?: string
  currentUserName?: string
  currentUserStatus?: string | null
}

/**
 * The messaging orchestrator. Owns the data — the conversation list, the
 * per-thread message cache, the outbox, realtime and its polling fallback —
 * and renders exactly one of the two width-specific views over it.
 */
export function MessagingClient({
  initialConversations,
  initialActiveConversation,
  initialMessages,
  currentUserId,
  currentUserRole,
  schoolId,
  initialLayout,
  initialServerTime,
  locale = "en",
  whatsappConnected = false,
  whatsappSession = null,
  schoolName = "",
  currentUserName = "",
  currentUserStatus = null,
}: MessagingClientProps) {
  const router = useRouter()
  const { dictionary } = useDictionary()
  const m = dictionary?.messaging
  const layout = useLayoutMode(initialLayout)

  const [conversations, setConversations] =
    useState<ConversationDTO[]>(initialConversations)
  const [activeConversation, setActiveConversation] =
    useState<ConversationDTO | null>(initialActiveConversation)
  const [isConnected, setIsConnected] = useState(false)
  const [showInfoPanel, setShowInfoPanel] = useState(false)
  // Typing indicators across all conversations (for sidebar + header)
  const [typingConversations, setTypingConversations] = useState<
    Map<string, boolean>
  >(new Map())
  const typingExpiryRef = useRef<Map<string, number>>(new Map())
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

  // Helper to update cached messages — only triggers render for active conversation
  const updateCachedMessages = useCallback(
    (convId: string, updater: (prev: MessageDTO[]) => MessageDTO[]) => {
      const state = cacheRef.current.get(convId)
      if (!state) return
      const next = updater(state.messages)
      if (next === state.messages) return
      state.messages = next
      state.lastMessageId = getLastRealMessageId(next)
      if (convId === activeConversationRef.current?.id) {
        setRenderTick((t) => t + 1)
      }
    },
    []
  )

  // Helper to update cache hasMore
  const updateCachedHasMore = useCallback(
    (convId: string, hasMore: boolean) => {
      const state = cacheRef.current.get(convId)
      if (state) {
        state.hasMore = hasMore
        if (convId === activeConversationRef.current?.id) {
          setRenderTick((t) => t + 1)
        }
      }
    },
    []
  )

  /** Reflect a message in the list row: preview, ordering, unread badge. */
  const bumpListWithMessage = useCallback(
    (convId: string, message: MessageDTO, countUnread: boolean) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === convId)
        if (idx < 0) return prev
        const conv = prev[idx]
        if (conv.lastMessage?.id === message.id) return prev
        const at = new Date(message.createdAt)
        if (
          conv.lastMessage &&
          new Date(conv.lastMessage.createdAt).getTime() > at.getTime()
        ) {
          return prev
        }
        const next = prev.slice()
        next[idx] = {
          ...conv,
          lastMessageAt: at,
          lastMessage: message,
          unreadCount: countUnread
            ? (conv.unreadCount ?? 0) + 1
            : (conv.unreadCount ?? 0),
        }
        return next.sort(byNewestFirst)
      })
    },
    []
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
  // online dots. Renders only once the Socket.IO server is live; until then
  // onlineUserIds stays empty (same as no presence) — no behavior change.
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

  // --- Socket.IO connection --------------------------------------------------
  // Nothing else on this route opens the socket: the header that does so on
  // the dashboard is not rendered here. Without this the page always polled,
  // even where a socket server was configured.
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SOCKET_URL) return
    socketService
      .connect(schoolId, currentUserId, currentUserRole)
      .catch(() => {})
  }, [schoolId, currentUserId, currentUserRole])

  useEffect(() => {
    setIsConnected(socketService.isConnected())

    const unsubscribe = socketService.onConnectionChange(async (connected) => {
      setIsConnected(connected)
      if (!connected) return
      socketService.subscribeToConversations(currentUserId)

      // Gap-fill: fetch messages missed during disconnect
      const activeId = activeConversationRef.current?.id
      if (activeId) {
        const cached = cacheRef.current.get(activeId)
        if (cached?.lastMessageId) {
          try {
            const result = await pollNewMessages({
              conversationId: activeId,
              afterMessageId: cached.lastMessageId,
            })
            if (result.success && result.data.items.length > 0) {
              updateCachedMessages(activeId, (prev) =>
                mergeServerMessages(prev, result.data.items as MessageDTO[])
              )
            }
          } catch {
            // Gap-fill is best-effort
          }
        }
      }

      // Background conversations: mark stale so they refetch on next switch
      for (const [convId, state] of cacheRef.current.entries()) {
        if (convId !== activeId) state.lastFetchedAt = 0
      }
    })

    if (socketService.isConnected()) {
      socketService.subscribeToConversations(currentUserId)
    }

    return () => {
      unsubscribe()
      if (socketService.isConnected()) {
        socketService.unsubscribeFromConversations(currentUserId)
      }
    }
  }, [currentUserId, updateCachedMessages])

  // --- List polling fallback (incremental) ----------------------------------
  const listSinceRef = useRef<string | null>(initialServerTime ?? null)
  useEffect(() => {
    if (isConnected) return

    let cancelled = false
    let inFlight = false
    let ticks = 0
    let timer: ReturnType<typeof setTimeout> | null = null

    const schedule = (delay: number) => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(tick, delay)
    }

    const tick = async () => {
      if (cancelled || document.visibilityState === "hidden") return
      if (!inFlight) {
        inFlight = true
        try {
          ticks++
          const since = listSinceRef.current
          const full = !since || ticks % LIST_FULL_EVERY === 0
          const result = await pollConversationUpdates(
            full ? undefined : { since }
          )
          if (!cancelled && result.success) {
            listSinceRef.current = result.data.serverTime
            const { conversations: rows, unreadCounts } = result.data
            const activeId = activeConversationRef.current?.id
            setConversations((prev) => {
              const byId = new Map<string, ConversationDTO>()
              if (!result.data.full) {
                for (const c of prev) byId.set(c.id, c)
              }
              for (const c of rows as ConversationDTO[]) byId.set(c.id, c)
              const next = Array.from(byId.values()).map((c) => {
                // The open thread reads as read here even if the server's
                // mark-as-read has not landed yet.
                const unread =
                  c.id === activeId
                    ? 0
                    : (unreadCounts[c.id] ?? c.unreadCount ?? 0)
                return unread === c.unreadCount ? c : { ...c, unreadCount: unread }
              })
              return next.sort(byNewestFirst)
            })
          }
        } catch {
          // Best effort; the next tick tries again.
        } finally {
          inFlight = false
        }
      }
      if (!cancelled) schedule(LIST_POLL_MS)
    }

    const wake = () => {
      if (document.visibilityState !== "visible") return
      schedule(0)
    }

    schedule(LIST_POLL_MS)
    document.addEventListener("visibilitychange", wake)
    window.addEventListener("focus", wake)
    window.addEventListener("online", wake)
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      document.removeEventListener("visibilitychange", wake)
      window.removeEventListener("focus", wake)
      window.removeEventListener("online", wake)
    }
  }, [isConnected])

  // --- Socket: list-level events ---------------------------------------------
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
      const isActive = data.conversationId === activeConversationRef.current?.id
      bumpListWithMessage(
        data.conversationId,
        newMsg,
        !isActive && data.senderId !== currentUserId
      )
      // Also update message cache for background conversations
      if (!isActive) {
        updateCachedMessages(data.conversationId, (prev) =>
          mergeServerMessages(prev, [newMsg])
        )
      }
    })

    // Typing indicators — listen globally, expire locally
    const unsubscribeTypingStart = socketService.on("typing:start", (data) => {
      if (data.userId === currentUserId) return
      typingExpiryRef.current.set(data.conversationId, Date.now() + TYPING_TTL_MS)
      setTypingConversations((prev) => {
        if (prev.get(data.conversationId)) return prev
        const next = new Map(prev)
        next.set(data.conversationId, true)
        return next
      })
    })

    const unsubscribeTypingStop = socketService.on("typing:stop", (data) => {
      typingExpiryRef.current.delete(data.conversationId)
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
  }, [isConnected, currentUserId, bumpListWithMessage, updateCachedMessages])

  // A typing indicator whose stop never arrived expires on its own.
  useEffect(() => {
    const interval = setInterval(() => {
      const expiry = typingExpiryRef.current
      if (expiry.size === 0) return
      const now = Date.now()
      const stale: string[] = []
      expiry.forEach((at, id) => {
        if (at <= now) stale.push(id)
      })
      if (stale.length === 0) return
      for (const id of stale) expiry.delete(id)
      setTypingConversations((prev) => {
        const next = new Map(prev)
        for (const id of stale) next.delete(id)
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // --- Active thread: socket room + polling fallback + mark-as-read ----------
  const getCursor = useCallback(
    (convId: string) => cacheRef.current.get(convId)?.lastMessageId ?? null,
    []
  )
  const mergeIncoming = useCallback(
    (convId: string, items: MessageDTO[]) => {
      updateCachedMessages(convId, (prev) => mergeServerMessages(prev, items))
      const newest = items[items.length - 1]
      if (newest) bumpListWithMessage(convId, newest, false)
    },
    [updateCachedMessages, bumpListWithMessage]
  )
  const { touch } = useThreadSync({
    conversationId: activeConversation?.id ?? null,
    currentUserId,
    isConnected,
    getCursor,
    mergeIncoming,
    updateMessages: updateCachedMessages,
  })

  // --- Outbox ----------------------------------------------------------------
  const sendAttemptsRef = useRef<Map<string, number>>(new Map())

  // The signed-in person's own photo, for the mobile "You" tab and the
  // optimistic rows. Their participant row carries it.
  const currentUserImage = useMemo(() => {
    for (const c of conversations) {
      const self = c.participants?.find((p) => p.userId === currentUserId)
      if (self?.user.image) return self.user.image
    }
    return null
  }, [conversations, currentUserId])
  const currentUserImageRef = useRef(currentUserImage)
  useEffect(() => {
    currentUserImageRef.current = currentUserImage
  }, [currentUserImage])

  /**
   * Put an optimistic row into the open thread and return its nonce. The row
   * shows at once with a clock; the server's answer confirms or fails it.
   */
  const handleOptimisticSend = useCallback(
    (
      content: string,
      replyToId?: string,
      attachments?: MessageAttachmentDTO[]
    ): string => {
      const nonce = crypto.randomUUID()
      const conv = activeConversationRef.current
      if (!conv) return nonce
      const hasAttachments = !!attachments && attachments.length > 0
      const contentType = hasAttachments
        ? attachments![0].fileType.startsWith("image/")
          ? "image"
          : attachments![0].fileType.startsWith("video/")
            ? "video"
            : "text"
        : "text"
      const now = new Date()
      const optimistic: MessageDTO = {
        id: tempIdFor(nonce),
        conversationId: conv.id,
        senderId: currentUserId,
        sender: {
          id: currentUserId,
          username: currentUserName || null,
          email: null,
          image: currentUserImageRef.current,
        },
        content,
        contentType,
        status: "sending",
        replyToId: replyToId || null,
        replyTo: replyToId
          ? (() => {
              const source = messagesRef.current.find((x) => x.id === replyToId)
              return source
                ? {
                    id: source.id,
                    content: source.content,
                    senderId: source.senderId,
                    isDeleted: source.isDeleted,
                    sender: {
                      id: source.sender.id,
                      username: source.sender.username,
                      email: source.sender.email,
                    },
                  }
                : null
            })()
          : null,
        forwardedFromId: null,
        isEdited: false,
        editedAt: null,
        isDeleted: false,
        deletedAt: null,
        isSystem: false,
        metadata: { clientNonce: nonce },
        whatsappStatus: null,
        whatsappPhone: null,
        createdAt: now,
        updatedAt: now,
        attachments: attachments || [],
        reactions: [],
        readReceipts: [],
        readCount: 0,
      }
      updateCachedMessages(conv.id, (prev) => [...prev, optimistic])
      bumpListWithMessage(conv.id, optimistic, false)
      sendAttemptsRef.current.set(nonce, 1)
      touch()
      return nonce
    },
    [currentUserId, currentUserName, updateCachedMessages, bumpListWithMessage, touch]
  )

  /**
   * Confirm: the optimistic row becomes the persisted one. If the poller or
   * the socket already delivered the persisted row, the optimistic one is
   * simply dropped — renaming it would put two rows under one id.
   */
  const handleMessageConfirmed = useCallback(
    (nonce: string, messageId: string, serverMessage?: MessageDTO) => {
      // The confirm can land after the reader switched threads, and the
      // desktop composer sends no server row — so find the thread that
      // actually holds the temp row before trusting the open one.
      const tempId = tempIdFor(nonce)
      const convId =
        Array.from(cacheRef.current.keys()).find((id) =>
          cacheRef.current.get(id)?.messages.some((x) => x.id === tempId)
        ) ??
        serverMessage?.conversationId ??
        activeConversationRef.current?.id
      if (!convId) return
      sendAttemptsRef.current.delete(nonce)
      updateCachedMessages(convId, (prev) => {
        const idx = prev.findIndex((x) => x.id === tempId)
        if (idx < 0) return prev
        if (prev.some((x) => x.id === messageId)) {
          return prev.filter((x) => x.id !== tempId)
        }
        const temp = prev[idx]
        const real: MessageDTO = serverMessage
          ? {
              ...serverMessage,
              // The server's row has no client-side blob URLs; keep any
              // attachment preview the optimistic row was showing until the
              // persisted attachments are there.
              attachments:
                serverMessage.attachments?.length > 0
                  ? serverMessage.attachments
                  : temp.attachments,
              status: serverMessage.status === "sending" ? "sent" : serverMessage.status,
            }
          : { ...temp, id: messageId, status: "sent" }
        const next = prev.slice()
        next[idx] = real
        return next
      })
    },
    [updateCachedMessages]
  )

  const handleMessageFailed = useCallback(
    (nonce: string) => {
      const tempId = tempIdFor(nonce)
      for (const [convId, state] of cacheRef.current.entries()) {
        if (!state.messages.some((x) => x.id === tempId)) continue
        updateCachedMessages(convId, (prev) =>
          prev.map((x) =>
            x.id === tempId ? { ...x, status: "failed" as MessageDTO["status"] } : x
          )
        )
        return
      }
    },
    [updateCachedMessages]
  )

  /** Send (or re-send) the optimistic row carrying this nonce. */
  const performSend = useCallback(
    async (convId: string, nonce: string) => {
      const tempId = tempIdFor(nonce)
      const temp = cacheRef.current
        .get(convId)
        ?.messages.find((x) => x.id === tempId)
      if (!temp) return
      try {
        const result = await sendMessage({
          conversationId: convId,
          content: temp.content,
          contentType: "text",
          replyToId: temp.replyToId ?? undefined,
          clientNonce: nonce,
        })
        if (result.success) {
          handleMessageConfirmed(
            nonce,
            result.data.id,
            result.data.message as MessageDTO | undefined
          )
        } else {
          handleMessageFailed(nonce)
          throw new Error(resolveMessagingError(result.error, mRef.current))
        }
      } catch (error) {
        handleMessageFailed(nonce)
        throw error
      }
    },
    [handleMessageConfirmed, handleMessageFailed]
  )

  /** Tap on a failed bubble, or the desktop retry control. */
  const handleRetryMessage = useCallback(
    (messageId: string) => {
      if (!isTempId(messageId)) return
      const nonce = nonceOf(messageId)
      let convId: string | undefined
      let temp: MessageDTO | undefined
      for (const [id, state] of cacheRef.current.entries()) {
        temp = state.messages.find((x) => x.id === messageId)
        if (temp) {
          convId = id
          break
        }
      }
      if (!convId || !temp) return
      if (temp.attachments.length > 0) {
        // The upload result was never stored; a media send has to be redone
        // from the picker.
        toast({
          title: mRef.current?.notifications?.error ?? "Error",
          description: mRef.current?.errors?.send_failed ?? "Failed to send message",
        })
        return
      }
      const attempts = sendAttemptsRef.current.get(nonce) ?? 0
      sendAttemptsRef.current.set(nonce, attempts + 1)
      updateCachedMessages(convId, (prev) =>
        prev.map((x) =>
          x.id === messageId ? { ...x, status: "sending" as MessageDTO["status"] } : x
        )
      )
      performSend(convId, nonce).catch(() => {})
    },
    [performSend, updateCachedMessages]
  )

  // Failed text sends are retried on their own when connectivity returns.
  useEffect(() => {
    const retryFailed = () => {
      for (const [convId, state] of cacheRef.current.entries()) {
        for (const x of state.messages) {
          if (x.status !== "failed" || !isTempId(x.id) || x.attachments.length)
            continue
          const attempts = sendAttemptsRef.current.get(nonceOf(x.id)) ?? 0
          if (attempts >= MAX_SEND_ATTEMPTS) continue
          handleRetryMessage(x.id)
        }
        void convId
      }
    }
    window.addEventListener("online", retryFailed)
    const unsubscribe = socketService.onConnectionChange((connected) => {
      if (connected) retryFailed()
    })
    return () => {
      window.removeEventListener("online", retryFailed)
      unsubscribe()
    }
  }, [handleRetryMessage])

  /**
   * Mobile send: the row appears before the request leaves, the composer is
   * already clear, and a failure shows on the bubble rather than as a toast.
   */
  const handleMobileSend = useCallback(
    (text: string) => {
      const conv = activeConversationRef.current
      if (!conv || !text.trim()) return
      const nonce = handleOptimisticSend(text)
      performSend(conv.id, nonce).catch(() => {})
    },
    [handleOptimisticSend, performSend]
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

  // --- Typing (outbound) -----------------------------------------------------
  const handleTypingStart = useCallback(() => {
    const conv = activeConversationRef.current
    if (conv && socketService.isConnected()) {
      socketService.sendTypingStart(conv.id)
    }
  }, [])
  const handleTypingStop = useCallback(() => {
    const conv = activeConversationRef.current
    if (conv && socketService.isConnected()) {
      socketService.sendTypingStop(conv.id)
    }
  }, [])

  // --- Drafts (mobile composer) ---------------------------------------------
  const draftsRef = useRef<Map<string, string> | null>(null)
  const drafts = () => (draftsRef.current ??= readDrafts())
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleDraftChange = useCallback((text: string) => {
    const conv = activeConversationRef.current
    if (!conv) return
    const map = drafts()
    if (text.trim()) map.set(conv.id, text)
    else map.delete(conv.id)
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    draftTimerRef.current = setTimeout(() => writeDrafts(map), 300)
  }, [])

  // --- Navigation --------------------------------------------------------------
  const handleBack = useCallback(() => {
    const conv = activeConversationRef.current
    if (conv) {
      const cached = cacheRef.current.get(conv.id)
      if (cached) cached.scrollPosition = -1
    }
    setActiveConversation(null)
    setShowInfoPanel(false)
    window.history.replaceState(null, "", `/${locale}/messages`)
  }, [locale])

  /** The row's badge clears the moment the thread opens. */
  const clearUnreadLocally = useCallback((conversationId: string) => {
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === conversationId)
      if (idx < 0 || !prev[idx].unreadCount) return prev
      const next = prev.slice()
      next[idx] = { ...prev[idx], unreadCount: 0 }
      return next
    })
  }, [])

  const switchToConversation = useCallback(
    async (conversationId: string) => {
      const listRow = conversationsRef.current.find(
        (c) => c.id === conversationId
      )
      // Check cache first
      const cached = cacheRef.current.get(conversationId)
      if (cached && Date.now() - cached.lastFetchedAt < CACHE_TTL) {
        // Cache hit — instant switch
        if (listRow) {
          setActiveConversation(listRow)
          clearUnreadLocally(conversationId)
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
      const result = await fetchConversationData({ conversationId, locale })
      if (result.success) {
        setActiveConversation({
          ...result.data.conversation,
          // The unread divider reads this; the detail query never carries it.
          unreadCount: listRow?.unreadCount ?? 0,
        })
        clearUnreadLocally(conversationId)
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
    [locale, clearUnreadLocally]
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
    const oldest = currentMessages.find((x) => !isTempId(x.id))
    if (!oldest) return
    const result = await loadMoreMessages({
      conversationId: conv.id,
      cursor: oldest.id,
      take: 50,
      direction: "before",
    })
    if (result.success) {
      const older = result.data.items as MessageDTO[]
      updateCachedMessages(conv.id, (prev) => {
        const ids = new Set(prev.map((x) => x.id))
        const fresh = older.filter((x) => !ids.has(x.id))
        return fresh.length ? [...fresh, ...prev] : prev
      })
      updateCachedHasMore(conv.id, result.data.hasMore)
    }
  }, [updateCachedMessages, updateCachedHasMore])

  // Save scroll position from ChatInterface
  const handleSaveScrollPosition = useCallback((position: number) => {
    const conv = activeConversationRef.current
    if (conv) {
      const cached = cacheRef.current.get(conv.id)
      if (cached) cached.scrollPosition = position
    }
  }, [])

  const openInfoPanel = useCallback(() => setShowInfoPanel(true), [])
  const toggleInfoPanel = useCallback(() => setShowInfoPanel((v) => !v), [])
  const closeInfoPanel = useCallback(() => setShowInfoPanel(false), [])

  // --- Labels ------------------------------------------------------------------
  // Labels the mobile WhatsApp conversation view needs to render a message.
  const adaptLabels: AdaptLabels = useMemo(
    () => ({
      today: m?.ui?.today ?? "Today",
      yesterday: m?.ui?.yesterday ?? "Yesterday",
      deleted: m?.ui?.this_message_deleted ?? "This message was deleted",
      photo: m?.ui?.photo ?? "Photo",
      video: m?.ui?.video ?? "Video",
      voice: m?.ui?.voice_message ?? "Voice message",
      location: m?.ui?.preview?.location ?? "Location",
      document: m?.ui?.document ?? "Document",
      attachment: m?.ui?.attachment ?? "Attachment",
      userFallback: m?.ui?.user_fallback ?? "User",
      groupFallback: m?.ui?.mobile?.group_fallback ?? "Group",
    }),
    [m]
  )

  const threadLabels: MessagesViewLabels = useMemo(
    () => ({
      statusSending: m?.status?.sending,
      statusSent: m?.status?.sent,
      statusDelivered: m?.status?.delivered,
      statusRead: m?.status?.read,
      statusFailed: m?.status?.failed,
      notSent: m?.ui?.mobile?.not_sent,
      loadingOlder: m?.ui?.mobile?.loading_older,
      scrollToBottom: m?.ui?.scroll_to_bottom,
      attach: m?.ui?.mobile?.attach,
      stickers: m?.ui?.mobile?.stickers,
      camera: m?.ui?.mobile?.camera,
      mic: m?.ui?.voice_message,
      send: m?.ui?.mobile?.send,
      cancelReply: m?.ui?.mobile?.cancel_reply,
    }),
    [m]
  )

  // Memoised: rebuilt inline it invalidated every memo in the chat list on
  // every tick.
  const shellLabels = useMemo(
    () => ({
      titleChats: m?.ui?.mobile?.title ?? "Messages",
      searchPlaceholder: m?.ui?.mobile?.search_placeholder ?? "Messages",
      filterAll: m?.ui?.filter?.all ?? "All",
      filterUnread: m?.ui?.filter?.unread ?? "Unread",
      filterFavourites: m?.ui?.filter?.favourites ?? "Favourites",
      filterGroups: m?.ui?.filter?.groups ?? "Groups",
      archivedLabel: m?.ui?.archived ?? "Archived",
      tabUpdates: m?.ui?.tab?.updates ?? "Updates",
      tabCalls: m?.ui?.tab?.calls ?? "Calls",
      tabClasses: m?.ui?.tab?.classes ?? "Classes",
      tabCommunities: m?.ui?.tab?.communities ?? "Communities",
      tabChats: m?.ui?.tab?.chats ?? "Chats",
      tabSettings: m?.ui?.tab?.settings ?? "Settings",
      tabBack: m?.ui?.tab?.back ?? "Back",
      tabYou: m?.ui?.you ?? "You",
      noticeTitle: m?.ui?.notice?.title ?? "Get message notifications",
      noticeBody:
        m?.ui?.notice?.body ?? "Make sure you know when you have new messages.",
      noticeAction: m?.ui?.notice?.action ?? "Turn on",
      noticeDismiss: m?.ui?.notice?.dismiss ?? "Dismiss",
      encryptPrefix: m?.ui?.encrypt?.prefix ?? "Your personal",
      encryptTopic: m?.ui?.encrypt?.topic_messages ?? "messages",
      encryptSuffix: m?.ui?.encrypt?.suffix ?? "are",
      encryptTail: m?.ui?.end_to_end_encrypted ?? "end-to-end encrypted",
      typingPreview: m?.ui?.typing ?? "typing...",
      previewPhoto: m?.ui?.preview?.photo ?? "Photo",
      previewVideo: m?.ui?.preview?.video ?? "Video",
      previewVoice: m?.ui?.preview?.voice ?? "Voice message",
      previewLocation: m?.ui?.preview?.location ?? "Location",
      previewDeleted: m?.ui?.preview?.deleted ?? "You deleted this message.",
      relativeYesterday: m?.ui?.relative_yesterday ?? "Yesterday",
      updatesRecent: m?.ui?.mobile?.updates_recent,
      updatesEmptyTitle: m?.ui?.mobile?.updates_empty_title,
      updatesEmptyBody: m?.ui?.mobile?.updates_empty_body,
      callsRecent: m?.ui?.mobile?.calls_recent,
      callsJoined: m?.ui?.mobile?.calls_joined,
      callsMissed: m?.ui?.mobile?.calls_missed,
      callsUpcoming: m?.ui?.mobile?.calls_upcoming,
      callsLive: m?.ui?.mobile?.calls_live,
      callsEmptyTitle: m?.ui?.mobile?.calls_empty_title,
      callsEmptyBody: m?.ui?.mobile?.calls_empty_body,
      callsEncrypted: m?.ui?.mobile?.calls_encrypted,
      communitiesRooms: m?.ui?.mobile?.communities_rooms,
      communitiesEmptyTitle: m?.ui?.mobile?.communities_empty_title,
      communitiesEmptyBody: m?.ui?.mobile?.communities_empty_body,
      communitiesMembers: m?.ui?.mobile?.communities_members,
      settingsDashboard: m?.ui?.mobile?.settings_dashboard,
      settingsProfile: m?.ui?.mobile?.settings_profile,
      settingsNotifications: m?.ui?.mobile?.settings_notifications,
      settingsStarred: m?.ui?.mobile?.settings_starred,
      loading: m?.ui?.mobile?.loading,
      loadFailed: m?.ui?.mobile?.load_failed,
    }),
    [m]
  )

  // The line under the name in the mobile chat header: what the other side is
  // doing on a 1:1, how many people are in the room on a group.
  const mobileHeaderSubtitle = useMemo(() => {
    if (!activeConversation) return null
    if (typingConversations.get(activeConversation.id)) {
      return m?.ui?.is_typing ?? null
    }
    if (activeConversation.type === "direct") {
      return activeContactUserId && onlineUserIds.has(activeContactUserId)
        ? (m?.ui?.online ?? null)
        : null
    }
    const count = activeConversation.participants?.length ?? 0
    if (count === 0) return null
    if (count === 1) return m?.ui?.member ?? null
    return m?.ui?.members?.replace("{count}", String(count)) ?? null
  }, [activeConversation, typingConversations, activeContactUserId, onlineUserIds, m])

  // The desktop ChatInterface re-renders this client, so don't rebuild the
  // mobile item list each time.
  const mobileChatItems = useMemo(
    () =>
      activeConversation && layout === "mobile"
        ? toChatItems(
            messages,
            currentUserId,
            activeConversation.type !== "direct",
            locale,
            adaptLabels
          )
        : [],
    [activeConversation, layout, messages, currentUserId, locale, adaptLabels]
  )

  const goDashboard = useCallback(
    () => router.push(`/${locale}/dashboard`),
    [router, locale]
  )
  const goProfile = useCallback(
    () => router.push(`/${locale}/profile`),
    [router, locale]
  )
  const goNotifications = useCallback(
    () => router.push(`/${locale}/notifications`),
    [router, locale]
  )
  const goCall = useCallback(
    (id: string) => router.push(`/${locale}/live/${id}`),
    [router, locale]
  )
  // Only staff can open an announcement's own page; the listings route
  // sends everyone else to /unauthorized. For a student or a guardian the
  // row is the announcement — title and opening line — and has no tap
  // target at all.
  const canOpenUpdates =
    currentUserRole === "ADMIN" || currentUserRole === "DEVELOPER"
  const goUpdate = useCallback(
    (id: string) => router.push(`/${locale}/announcements/${id}`),
    [router, locale]
  )

  // --- Render ------------------------------------------------------------------
  if (layout === "desktop") {
    const thread: DesktopViewProps["thread"] = {
      messages,
      hasMoreMessages,
      currentUserId,
      locale,
      isConnected,
      whatsappConnected,
      onEditMessage: handleEditMessage,
      onDeleteMessage: handleDeleteMessage,
      onReactToMessage: handleReactToMessage,
      onRemoveReaction: handleRemoveReaction,
      onLoadMoreMessages: handleLoadMoreMessages,
      onOptimisticSend: handleOptimisticSend,
      onMessageConfirmed: handleMessageConfirmed,
      onMessageFailed: handleMessageFailed,
      onRetryMessage: handleRetryMessage,
      onTypingStart: handleTypingStart,
      onTypingStop: handleTypingStop,
      onBack: handleBack,
      onViewDetails: toggleInfoPanel,
      onViewParticipants: openInfoPanel,
      onSaveScrollPosition: handleSaveScrollPosition,
      savedScrollPosition: activeState?.scrollPosition ?? -1,
    }
    return (
      <div className="bg-msg-chat-bg relative flex h-full">
        <DesktopView
          conversations={conversations}
          activeConversation={activeConversation}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          locale={locale}
          whatsappSession={whatsappSession}
          typingConversations={typingConversations}
          showInfoPanel={showInfoPanel}
          onContactClick={handleContactClick}
          onCloseInfoPanel={closeInfoPanel}
          thread={thread}
        />
      </div>
    )
  }

  const shell: MobileViewProps["shell"] = {
    schoolName,
    currentUserName,
    currentUserStatus,
    onOpenDashboard: goDashboard,
    onOpenProfile: goProfile,
    onOpenNotifications: goNotifications,
    onOpenCall: goCall,
    onOpenUpdate: canOpenUpdates ? goUpdate : undefined,
    conversations,
    currentUserId,
    activeConversationId: activeConversation?.id ?? null,
    typingConversations,
    onlineUserIds,
    onConversationClick: switchToConversation,
    currentUserImage,
    locale,
    labels: shellLabels,
  }

  const thread: MobileViewProps["thread"] = activeConversation
    ? {
        contactName: conversationTitle(
          activeConversation,
          currentUserId,
          adaptLabels
        ),
        contactSubtitle: mobileHeaderSubtitle,
        contactAvatarUrl: conversationAvatar(activeConversation, currentUserId),
        backLabel: m?.ui?.back,
        items: mobileChatItems,
        hasMore: hasMoreMessages,
        onLoadMore: handleLoadMoreMessages,
        onBack: handleBack,
        onTapInfo: openInfoPanel,
        onSend: handleMobileSend,
        onRetry: handleRetryMessage,
        onTypingStart: handleTypingStart,
        onTypingStop: handleTypingStop,
        draftText: drafts().get(activeConversation.id) ?? "",
        onDraftChange: handleDraftChange,
        inputPlaceholder: m?.ui?.mobile?.input_placeholder ?? "Message",
        encryptionNotice: m?.ui?.encryption_notice,
        encryptionLearnMore: m?.ui?.encryption_learn_more,
        labels: threadLabels,
      }
    : null

  return (
    <div className="bg-msg-chat-bg relative flex h-full">
      <MobileView
        activeConversation={activeConversation}
        shell={shell}
        thread={thread}
      />
    </div>
  )
}
