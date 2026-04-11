"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useRef, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { ArrowLeft } from "lucide-react"

import { cn } from "@/lib/utils"
import socketService from "@/lib/websocket/socket-service"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { UserFilledIcon } from "@/components/atom/icons"
import type { UploadedFileResult } from "@/components/file"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import {
  markConversationAsRead,
  pollNewMessages,
  toggleConversationWhatsApp,
} from "./actions"
import { CONVERSATION_TYPE_CONFIG } from "./config"
import { useUserPresence } from "./hooks/use-presence"
import { MessageInput } from "./message-input"
import { MessageList, MessageListSkeleton } from "./message-list"
import { buildMessageFromSocket } from "./messaging-client"
import type {
  ConversationDTO,
  MessageAttachmentDTO,
  MessageDTO,
  TypingIndicatorDTO,
} from "./types"

const AVATAR_COLORS = [
  { bg: "#CBF2EE", icon: "#028377" },
  { bg: "#E9E0FF", icon: "#5D47DE" },
  { bg: "#FEF1D4", icon: "#9D6C2C" },
  { bg: "#FBD8DC", icon: "#D10335" },
]

function getAvatarColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export interface ChatInterfaceProps {
  conversation: ConversationDTO
  messages: MessageDTO[]
  hasMoreMessages: boolean
  currentUserId: string
  locale?: "ar" | "en"
  isConnected: boolean
  whatsappConnected?: boolean
  onSendMessage: (
    content: string,
    replyToId?: string
  ) => Promise<MessageDTO | void>
  onEditMessage: (messageId: string, content: string) => Promise<void>
  onDeleteMessage: (messageId: string) => Promise<void>
  onReactToMessage: (messageId: string, emoji: string) => Promise<void>
  onRemoveReaction: (reactionId: string) => Promise<void>
  onFileUpload?: (files: UploadedFileResult[]) => void
  onLoadMoreMessages?: () => Promise<void>
  onMessagesUpdate: (
    convId: string,
    updater: (prev: MessageDTO[]) => MessageDTO[]
  ) => void
  onViewParticipants?: () => void
  onViewDetails?: () => void
  onBack?: () => void
  onSaveScrollPosition?: (position: number) => void
  savedScrollPosition?: number
  className?: string
}

export function ChatInterface({
  conversation,
  messages,
  hasMoreMessages,
  currentUserId,
  locale = "en",
  isConnected,
  whatsappConnected = false,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onReactToMessage,
  onRemoveReaction,
  onFileUpload,
  onLoadMoreMessages,
  onMessagesUpdate,
  onViewParticipants,
  onViewDetails,
  onBack,
  onSaveScrollPosition,
  savedScrollPosition = -1,
  className,
}: ChatInterfaceProps) {
  const { dictionary } = useDictionary()
  const m = dictionary?.messaging
  const [replyTo, setReplyTo] = useState<MessageDTO | null>(null)
  const [editingMessage, setEditingMessage] = useState<MessageDTO | null>(null)
  const [typingUsers, setTypingUsers] = useState<TypingIndicatorDTO[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [whatsappEnabled, setWhatsappEnabled] = useState(
    conversation.whatsappEnabled ?? false
  )

  // Offline message queue — retry on reconnect
  type PendingMessage = {
    nonce: string
    content: string
    replyToId?: string
    conversationId: string
    retryCount: number
  }
  const pendingQueueRef = useRef<PendingMessage[]>([])

  // Track conversation changes without full remount
  const prevConvIdRef = useRef(conversation.id)
  useEffect(() => {
    if (prevConvIdRef.current !== conversation.id) {
      // Conversation changed — reset local UI state
      setReplyTo(null)
      setEditingMessage(null)
      setTypingUsers([])
      setWhatsappEnabled(conversation.whatsappEnabled ?? false)
      prevConvIdRef.current = conversation.id
    }
  }, [conversation.id, conversation.whatsappEnabled])

  // Presence tracking for direct conversations
  const otherUserId =
    conversation.type === "direct"
      ? conversation.participants.find((p) => p.userId !== currentUserId)
          ?.userId
      : undefined
  const otherPresence = useUserPresence(otherUserId)
  const dateLocale = locale === "ar" ? ar : enUS

  // WhatsApp toggle handler
  const handleToggleWhatsApp = useCallback(async () => {
    const newValue = !whatsappEnabled
    setWhatsappEnabled(newValue)
    try {
      const result = await toggleConversationWhatsApp({
        conversationId: conversation.id,
        enabled: newValue,
      })
      if (!result.success) {
        setWhatsappEnabled(!newValue)
        toast({
          title: m?.notifications?.error || "Error",
          description: result.error,
        })
      }
    } catch {
      setWhatsappEnabled(!newValue)
      toast({
        title: m?.notifications?.error || "Error",
        description: m?.errors?.network_error || "Network error",
      })
    }
  }, [whatsappEnabled, conversation.id, m])

  // Direct cache optimistic send — no useOptimistic, no double render
  const handleOptimisticSend = useCallback(
    (
      content: string,
      replyToId?: string,
      attachments?: MessageAttachmentDTO[]
    ): string => {
      const nonce = crypto.randomUUID()
      const hasAttachments = attachments && attachments.length > 0
      const contentType = hasAttachments
        ? attachments[0].fileType.startsWith("image/")
          ? "image"
          : attachments[0].fileType.startsWith("video/")
            ? "video"
            : "text"
        : "text"
      const optimisticMessage: MessageDTO = {
        id: `temp-${nonce}`,
        conversationId: conversation.id,
        senderId: currentUserId,
        sender: {
          id: currentUserId,
          username: null,
          email: null,
          image: null,
        },
        content,
        contentType,
        status: "sending",
        replyToId: replyToId || null,
        replyTo: replyToId
          ? messages.find((msg) => msg.id === replyToId) || null
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
        createdAt: new Date(),
        updatedAt: new Date(),
        attachments: attachments || [],
        reactions: [],
        readReceipts: [],
        readCount: 0,
      }
      // Add directly to cache — instant, single render
      onMessagesUpdate(conversation.id, (prev) => [...prev, optimisticMessage])
      return nonce
    },
    [conversation.id, currentUserId, messages, onMessagesUpdate]
  )

  // Confirm: swap temp-{nonce} → real message in-place (only icon transitions)
  const handleMessageConfirmed = useCallback(
    (nonce: string, messageId: string) => {
      onMessagesUpdate(conversation.id, (prev) =>
        prev.map((msg) =>
          msg.id === `temp-${nonce}`
            ? {
                ...msg,
                id: messageId,
                status: "sent" as MessageDTO["status"],
              }
            : msg
        )
      )
    },
    [conversation.id, onMessagesUpdate]
  )

  // Fail: mark temp message as failed
  const handleMessageFailed = useCallback(
    (nonce: string) => {
      onMessagesUpdate(conversation.id, (prev) =>
        prev.map((msg) =>
          msg.id === `temp-${nonce}`
            ? { ...msg, status: "failed" as MessageDTO["status"] }
            : msg
        )
      )
    },
    [conversation.id, onMessagesUpdate]
  )

  const config = CONVERSATION_TYPE_CONFIG[conversation.type]

  // Header display info
  const otherUser =
    conversation.type === "direct"
      ? conversation.participants?.find((p) => p.userId !== currentUserId)?.user
      : null

  const displayName =
    conversation.type === "direct" && otherUser
      ? otherUser.username || otherUser.email || m?.ui?.user_fallback || "User"
      : conversation.title || m?.types?.[conversation.type] || config.label

  const avatarUrl =
    conversation.type === "direct" && otherUser
      ? otherUser.image || undefined
      : conversation.avatar || undefined

  const avatarFallback = displayName?.[0]?.toUpperCase() || "C"

  // Participant names for subtitle
  const participantNames =
    conversation.type !== "direct"
      ? conversation.participants
          ?.filter((p) => p.userId !== currentUserId)
          .slice(0, 3)
          .map((p) => p.user.username || p.user.email?.split("@")[0])
          .join(", ")
      : null

  // Debounced markConversationAsRead
  const markAsReadTimerRef = useRef<NodeJS.Timeout | null>(null)
  const debouncedMarkAsRead = useCallback(() => {
    if (markAsReadTimerRef.current) return
    markAsReadTimerRef.current = setTimeout(() => {
      markConversationAsRead({ conversationId: conversation.id }).catch(
        () => {}
      )
      markAsReadTimerRef.current = null
    }, 2000)
  }, [conversation.id])

  // Mark as read when opened or conversation changes
  useEffect(() => {
    debouncedMarkAsRead()
    return () => {
      if (markAsReadTimerRef.current) {
        clearTimeout(markAsReadTimerRef.current)
        markAsReadTimerRef.current = null
      }
    }
  }, [conversation.id, debouncedMarkAsRead])

  // --- Real-time updates via Socket.IO (reactive to connection state) ---
  useEffect(() => {
    if (!isConnected) return

    socketService.subscribeToConversation(conversation.id)

    // Flush pending message queue on reconnect
    if (pendingQueueRef.current.length > 0) {
      const queue = [...pendingQueueRef.current]
      pendingQueueRef.current = []
      for (const pending of queue) {
        if (pending.conversationId !== conversation.id) {
          pendingQueueRef.current.push(pending)
          continue
        }
        // Update status to "sending"
        onMessagesUpdate(conversation.id, (prev) =>
          prev.map((msg) =>
            msg.id === `temp-${pending.nonce}`
              ? { ...msg, status: "sending" as MessageDTO["status"] }
              : msg
          )
        )
        onSendMessage(pending.content, pending.replyToId)
          .then((sentMessage) => {
            if (sentMessage) {
              onMessagesUpdate(conversation.id, (prev) => {
                const withoutTemp = prev.filter(
                  (msg) => msg.id !== `temp-${pending.nonce}`
                )
                if (withoutTemp.some((msg) => msg.id === sentMessage.id))
                  return withoutTemp
                return [...withoutTemp, sentMessage]
              })
            }
          })
          .catch(() => {
            pending.retryCount++
            if (pending.retryCount < 3) {
              pendingQueueRef.current.push(pending)
            }
            onMessagesUpdate(conversation.id, (prev) =>
              prev.map((msg) =>
                msg.id === `temp-${pending.nonce}`
                  ? { ...msg, status: "failed" as MessageDTO["status"] }
                  : msg
              )
            )
          })
      }
    }

    const unsubscribeNewMessage = socketService.on("message:new", (data) => {
      if (data.conversationId !== conversation.id) return

      const newMessage = buildMessageFromSocket(data)

      onMessagesUpdate(conversation.id, (prev) => {
        // Already exists by real ID (confirmed via form response or prior socket)
        if (prev.some((msg) => msg.id === data.id)) return prev

        if (data.senderId === currentUserId) {
          // Own message — check if already confirmed (temp replaced with real ID)
          const serverNonce = (data.metadata as Record<string, unknown>)
            ?.clientNonce as string | undefined
          if (serverNonce) {
            // Temp still pending? Replace it. Already confirmed? Skip.
            const tempIdx = prev.findIndex(
              (msg) => msg.id === `temp-${serverNonce}`
            )
            if (tempIdx >= 0) {
              return prev.map((msg) =>
                msg.id === `temp-${serverNonce}` ? newMessage : msg
              )
            }
            // No temp found = already confirmed via form response → skip
            return prev
          }
        }
        // Message from others or no nonce
        return [...prev, newMessage]
      })

      if (data.senderId !== currentUserId) {
        debouncedMarkAsRead()
      }
    })

    const unsubscribeMessageUpdated = socketService.on(
      "message:updated",
      (data) => {
        onMessagesUpdate(conversation.id, (prev) =>
          prev.map((msg) =>
            msg.id === data.messageId
              ? {
                  ...msg,
                  content: data.content,
                  isEdited: true,
                  updatedAt: new Date(data.editedAt),
                }
              : msg
          )
        )
      }
    )

    const unsubscribeMessageDeleted = socketService.on(
      "message:deleted",
      (data) => {
        onMessagesUpdate(conversation.id, (prev) =>
          prev.map((msg) =>
            msg.id === data.messageId
              ? { ...msg, isDeleted: true, deletedAt: new Date(data.deletedAt) }
              : msg
          )
        )
      }
    )

    const unsubscribeReaction = socketService.on("message:reaction", (data) => {
      onMessagesUpdate(conversation.id, (prev) =>
        prev.map((msg) => {
          if (msg.id !== data.messageId) return msg
          const existingReaction = msg.reactions.find(
            (r) => r.userId === data.userId && r.emoji === data.emoji
          )
          if (existingReaction) {
            return {
              ...msg,
              reactions: msg.reactions.filter(
                (r) => r.id !== existingReaction.id
              ),
            }
          }
          return {
            ...msg,
            reactions: [
              ...msg.reactions,
              {
                id: `${data.userId}-${data.emoji}`,
                messageId: data.messageId,
                userId: data.userId,
                user: {
                  id: data.userId,
                  username: null,
                  email: null,
                  image: null,
                  role: "",
                },
                emoji: data.emoji,
                createdAt: new Date(),
              },
            ],
          }
        })
      )
    })

    const unsubscribeTypingStart = socketService.on("typing:start", (data) => {
      if (
        data.conversationId === conversation.id &&
        data.userId !== currentUserId
      ) {
        setTypingUsers((prev) => {
          if (!prev.find((u) => u.userId === data.userId)) {
            return [
              ...prev,
              {
                conversationId: data.conversationId,
                userId: data.userId,
                user: {
                  id: data.userId,
                  username: data.username,
                  image: null,
                },
                startedAt: new Date(),
              },
            ]
          }
          return prev
        })
      }
    })

    const unsubscribeTypingStop = socketService.on("typing:stop", (data) => {
      if (data.conversationId === conversation.id) {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId))
      }
    })

    // Real-time read receipts — update sent message ticks to "read"
    const unsubscribeMessageRead = socketService.on("message:read", (data) => {
      if (
        data.userId !== currentUserId &&
        data.conversationId === conversation.id
      ) {
        onMessagesUpdate(conversation.id, (prev) =>
          prev.map((msg) =>
            msg.senderId === currentUserId && msg.status !== "read"
              ? { ...msg, status: "read" as MessageDTO["status"] }
              : msg
          )
        )
      }
    })

    return () => {
      unsubscribeNewMessage()
      unsubscribeMessageUpdated()
      unsubscribeMessageDeleted()
      unsubscribeReaction()
      unsubscribeTypingStart()
      unsubscribeTypingStop()
      unsubscribeMessageRead()
      socketService.unsubscribeFromConversation(conversation.id)
    }
  }, [
    conversation.id,
    currentUserId,
    isConnected,
    onMessagesUpdate,
    debouncedMarkAsRead,
  ])

  // Auto-remove typing indicators after 5s (only when someone is typing)
  useEffect(() => {
    if (typingUsers.length === 0) return
    const interval = setInterval(() => {
      setTypingUsers((prev) => {
        const now = new Date().getTime()
        return prev.filter((u) => now - new Date(u.startedAt).getTime() < 5000)
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [typingUsers.length])

  // Polling fallback — stable, ref-based cursor
  const lastMessageIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (messages.length > 0) {
      lastMessageIdRef.current = messages[messages.length - 1].id
    }
  }, [messages])

  useEffect(() => {
    if (isConnected) return

    let active = true
    const poll = async () => {
      if (!active || !lastMessageIdRef.current) return
      const result = await pollNewMessages({
        conversationId: conversation.id,
        afterMessageId: lastMessageIdRef.current,
      })
      if (result.success && result.data.items.length > 0) {
        onMessagesUpdate(conversation.id, (prev) => {
          const existingIds = new Set(prev.map((msg) => msg.id))
          const newItems = result.data.items.filter(
            (item: MessageDTO) => !existingIds.has(item.id)
          )
          return newItems.length > 0 ? [...prev, ...newItems] : prev
        })
        debouncedMarkAsRead()
      }
    }

    const timer = setInterval(poll, 5000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [conversation.id, isConnected, onMessagesUpdate, debouncedMarkAsRead])

  // Retry a failed message
  const handleRetryMessage = useCallback(
    async (messageId: string) => {
      // Extract nonce from temp message ID
      const nonce = messageId.startsWith("temp-")
        ? messageId.slice(5)
        : undefined
      if (!nonce) return

      const pending = pendingQueueRef.current.find((p) => p.nonce === nonce)
      if (!pending) return

      // Update status to "sending"
      onMessagesUpdate(conversation.id, (prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, status: "sending" as MessageDTO["status"] }
            : msg
        )
      )

      try {
        const sentMessage = await onSendMessage(
          pending.content,
          pending.replyToId
        )
        pendingQueueRef.current = pendingQueueRef.current.filter(
          (p) => p.nonce !== nonce
        )
        if (sentMessage) {
          onMessagesUpdate(conversation.id, (prev) => {
            const withoutTemp = prev.filter((msg) => msg.id !== messageId)
            if (withoutTemp.some((msg) => msg.id === sentMessage.id)) {
              return withoutTemp
            }
            return [...withoutTemp, sentMessage]
          })
        }
      } catch {
        pending.retryCount++
        if (pending.retryCount >= 3) {
          pendingQueueRef.current = pendingQueueRef.current.filter(
            (p) => p.nonce !== nonce
          )
        }
        onMessagesUpdate(conversation.id, (prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, status: "failed" as MessageDTO["status"] }
              : msg
          )
        )
      }
    },
    [conversation.id, onSendMessage, onMessagesUpdate]
  )

  const handleEditMessage = async (message: MessageDTO) => {
    setEditingMessage(message)
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await onDeleteMessage(messageId)
    } catch {
      toast({
        title: m?.notifications?.error || "Error",
        description: m?.errors?.delete_failed || "Failed to delete message",
      })
    }
  }

  const handleReactToMessage = async (messageId: string, emoji: string) => {
    try {
      await onReactToMessage(messageId, emoji)
    } catch {
      toast({
        title: m?.notifications?.error || "Error",
        description: m?.errors?.react_failed || "Failed to add reaction",
      })
    }
  }

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMessages || !hasMoreMessages || !onLoadMoreMessages) return
    setIsLoadingMessages(true)
    try {
      await onLoadMoreMessages()
    } finally {
      setIsLoadingMessages(false)
    }
  }, [isLoadingMessages, hasMoreMessages, onLoadMoreMessages])

  const handleTypingStart = () => {
    socketService.sendTypingStart(conversation.id)
  }

  const handleTypingStop = () => {
    socketService.sendTypingStop(conversation.id)
  }

  const currentParticipant = conversation.participants?.find(
    (p) => p.userId === currentUserId
  )
  const canSendMessages = currentParticipant?.role !== "read_only"

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Header */}
      <div
        className="flex h-12 flex-shrink-0 items-center gap-3 px-3"
        style={{ backgroundColor: "#F4F4F4" }}
      >
        {/* Back arrow — mobile only */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-8 w-8 flex-shrink-0 rounded-full md:hidden"
          aria-label={m?.ui?.back || "Back"}
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        </Button>

        {/* Avatar — clickable, opens contact dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <button className="flex-shrink-0 rounded-full focus:outline-none">
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback
                  className="flex items-center justify-center"
                  style={{
                    backgroundColor: getAvatarColor(
                      otherUserId || conversation.id
                    ).bg,
                  }}
                >
                  <UserFilledIcon
                    className="h-4 w-4"
                    style={{
                      color: getAvatarColor(otherUserId || conversation.id)
                        .icon,
                    }}
                  />
                </AvatarFallback>
              </Avatar>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[360px]">
            <DialogHeader>
              <DialogTitle className="sr-only">
                {m?.ui?.contact_info || "Contact info"}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback
                  className="flex items-center justify-center"
                  style={{
                    backgroundColor: getAvatarColor(
                      otherUserId || conversation.id
                    ).bg,
                  }}
                >
                  <UserFilledIcon
                    className="h-10 w-10"
                    style={{
                      color: getAvatarColor(otherUserId || conversation.id)
                        .icon,
                    }}
                  />
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="text-lg font-semibold">{displayName}</h3>
                {otherUser?.email && (
                  <p className="text-muted-foreground text-sm">
                    {otherUser.email}
                  </p>
                )}
                {participantNames && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    {participantNames}
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Name + presence */}
        <div className="min-w-0 flex-1">
          <h2 className="text-foreground truncate text-sm font-medium">
            {displayName}
          </h2>
          {conversation.type === "direct" &&
            otherPresence.state === "online" && (
              <p className="text-xs text-emerald-500">
                {m?.ui?.online || "online"}
              </p>
            )}
          {conversation.type === "direct" &&
            otherPresence.state === "offline" &&
            otherPresence.lastSeenAt && (
              <p className="text-muted-foreground text-xs">
                {m?.ui?.last_seen || "last seen"}{" "}
                {formatDistanceToNow(new Date(otherPresence.lastSeenAt), {
                  addSuffix: true,
                  locale: dateLocale,
                })}
              </p>
            )}
        </div>

        {/* Action icons — video + call */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full"
            aria-label={m?.ui?.video_call || "Video call"}
          >
            <img
              src="/cam-recorder.png"
              alt=""
              className="h-5 w-5 object-contain"
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full"
            aria-label={m?.ui?.voice_call || "Voice call"}
          >
            <img
              src="/telephone.png"
              alt=""
              className="h-3.5 w-3.5 object-contain"
            />
          </Button>
          {whatsappConnected && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 rounded-full",
                whatsappEnabled && "bg-green-50"
              )}
              aria-label="WhatsApp"
              onClick={handleToggleWhatsApp}
            >
              <span
                className={cn(
                  "text-sm font-bold",
                  whatsappEnabled ? "text-green-600" : "text-muted-foreground"
                )}
              >
                W
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Messages — background rendered by MessageList */}
      <div className="relative flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          locale={locale}
          conversationType={conversation.type}
          isLoading={isLoadingMessages}
          hasMore={hasMoreMessages}
          onLoadMore={handleLoadMore}
          onReply={setReplyTo}
          onEdit={handleEditMessage}
          onDelete={handleDeleteMessage}
          onReact={handleReactToMessage}
          onRemoveReaction={onRemoveReaction}
          onRetry={handleRetryMessage}
          savedScrollPosition={savedScrollPosition}
          onSaveScrollPosition={onSaveScrollPosition}
          unreadCount={conversation.unreadCount ?? 0}
          className="h-full"
        />

        {/* Typing indicator — WhatsApp bouncing dots bubble */}
        {typingUsers.length > 0 && (
          <div className="absolute start-4 bottom-2 z-10">
            <div
              className="flex items-center gap-2 rounded-lg rounded-ss-sm bg-white px-5 py-2.5 shadow-sm"
              style={{ border: "1px solid #CCCCCC" }}
            >
              <span
                className="h-2.5 w-2.5 animate-bounce rounded-full"
                style={{ backgroundColor: "#1FA961", animationDelay: "0ms" }}
              />
              <span
                className="h-2.5 w-2.5 animate-bounce rounded-full"
                style={{ backgroundColor: "#1FA961", animationDelay: "150ms" }}
              />
              <span
                className="h-2.5 w-2.5 animate-bounce rounded-full"
                style={{ backgroundColor: "#1FA961", animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      {canSendMessages ? (
        <MessageInput
          conversationId={conversation.id}
          locale={locale}
          replyTo={replyTo}
          whatsappEnabled={whatsappEnabled}
          onCancelReply={() => setReplyTo(null)}
          onFileUpload={onFileUpload}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
          onOptimisticSend={handleOptimisticSend}
          onMessageConfirmed={handleMessageConfirmed}
          onMessageFailed={handleMessageFailed}
        />
      ) : (
        <div className="bg-msg-header-bg text-muted-foreground border-border border-t p-4 text-center text-sm">
          {m?.ui?.no_permission_send ||
            "You don't have permission to send messages in this conversation"}
        </div>
      )}
    </div>
  )
}

export function ChatInterfaceSkeleton({
  locale = "en",
}: {
  locale?: "ar" | "en"
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Header skeleton */}
      <div className="bg-msg-header-bg border-border flex h-[60px] items-center gap-3 border-b px-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
      </div>
      <MessageListSkeleton locale={locale} />
      {/* Input skeleton */}
      <div className="bg-msg-header-bg border-border border-t px-3 py-2">
        <Skeleton className="h-[42px] rounded-[21px]" />
      </div>
    </div>
  )
}
