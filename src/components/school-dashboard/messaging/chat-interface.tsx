"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useOptimistic, useState } from "react"
import {
  ArrowLeft,
  EllipsisVertical,
  Info,
  Phone,
  Search,
  Users,
  Video,
} from "lucide-react"

import { cn } from "@/lib/utils"
import socketService from "@/lib/websocket/socket-service"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import type { UploadedFileResult } from "@/components/file"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { formatDistanceToNow } from "date-fns"
import { ar, enUS } from "date-fns/locale"

import {
  markConversationAsRead,
  pollNewMessages,
  toggleConversationWhatsApp,
} from "./actions"
import { CONVERSATION_TYPE_CONFIG } from "./config"
import { MessageInput } from "./message-input"
import { MessageList, MessageListSkeleton } from "./message-list"
import { useUserPresence } from "./hooks/use-presence"
import { MessageSearch } from "./message-search"
import type { ConversationDTO, MessageDTO, TypingIndicatorDTO } from "./types"

export interface ChatInterfaceProps {
  conversation: ConversationDTO
  initialMessages: MessageDTO[]
  currentUserId: string
  locale?: "ar" | "en"
  whatsappConnected?: boolean
  onSendMessage: (content: string, replyToId?: string) => Promise<void>
  onEditMessage: (messageId: string, content: string) => Promise<void>
  onDeleteMessage: (messageId: string) => Promise<void>
  onReactToMessage: (messageId: string, emoji: string) => Promise<void>
  onRemoveReaction: (reactionId: string) => Promise<void>
  onFileUpload?: (files: UploadedFileResult[]) => void
  onLoadMoreMessages?: () => Promise<void>
  onViewParticipants?: () => void
  onViewDetails?: () => void
  onBack?: () => void
  hasMoreMessages?: boolean
  className?: string
}

export function ChatInterface({
  conversation,
  initialMessages,
  currentUserId,
  locale = "en",
  whatsappConnected = false,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onReactToMessage,
  onRemoveReaction,
  onFileUpload,
  onLoadMoreMessages,
  onViewParticipants,
  onViewDetails,
  onBack,
  hasMoreMessages = false,
  className,
}: ChatInterfaceProps) {
  const { dictionary } = useDictionary()
  const m = dictionary?.messaging
  const [messages, setMessages] = useState<MessageDTO[]>(initialMessages)
  const [replyTo, setReplyTo] = useState<MessageDTO | null>(null)
  const [editingMessage, setEditingMessage] = useState<MessageDTO | null>(null)
  const [typingUsers, setTypingUsers] = useState<TypingIndicatorDTO[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [whatsappEnabled, setWhatsappEnabled] = useState(
    conversation.whatsappEnabled ?? false
  )
  const [isTogglingWhatsApp, setIsTogglingWhatsApp] = useState(false)

  // Presence tracking for direct conversations
  const otherUserId =
    conversation.type === "direct"
      ? conversation.participants.find((p) => p.userId !== currentUserId)
          ?.userId
      : undefined
  const otherPresence = useUserPresence(otherUserId)
  const dateLocale = locale === "ar" ? ar : enUS

  // Optimistic updates (React 19)
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage: MessageDTO) => [...state, newMessage]
  )

  const handleOptimisticSend = useCallback(
    (content: string, replyToId?: string) => {
      const optimisticMessage: MessageDTO = {
        id: `temp-${Date.now()}`,
        conversationId: conversation.id,
        senderId: currentUserId,
        sender: {
          id: currentUserId,
          username: null,
          email: null,
          image: null,
        },
        content,
        contentType: "text",
        status: "sending",
        replyToId: replyToId || null,
        replyTo: replyToId
          ? messages.find((m) => m.id === replyToId) || null
          : null,
        forwardedFromId: null,
        isEdited: false,
        editedAt: null,
        isDeleted: false,
        deletedAt: null,
        isSystem: false,
        metadata: null,
        whatsappStatus: null,
        whatsappPhone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        attachments: [],
        reactions: [],
        readReceipts: [],
        readCount: 0,
      }
      addOptimisticMessage(optimisticMessage)
    },
    [conversation.id, currentUserId, messages, addOptimisticMessage]
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
      : conversation.title || config.label

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

  // Mark conversation as read when opened
  useEffect(() => {
    markConversationAsRead({ conversationId: conversation.id }).catch(() => {})
  }, [conversation.id])

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (!socketService.isConnected()) return

    socketService.subscribeToConversation(conversation.id)

    const unsubscribeNewMessage = socketService.on("message:new", (data) => {
      if (data.conversationId === conversation.id) {
        const newMessage: MessageDTO = {
          id: data.id,
          conversationId: data.conversationId,
          senderId: data.senderId,
          sender: {
            id: data.senderId,
            username: null,
            email: null,
            image: null,
          },
          content: data.content,
          contentType: data.contentType || "text",
          status: "sent",
          replyToId: null,
          replyTo: null,
          forwardedFromId: null,
          isEdited: false,
          editedAt: null,
          isDeleted: false,
          deletedAt: null,
          isSystem: false,
          metadata: null,
          whatsappStatus: null,
          whatsappPhone: null,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.createdAt),
          attachments: [],
          reactions: [],
          readReceipts: [],
          readCount: 0,
        }

        setMessages((prev) => {
          if (data.senderId === currentUserId) {
            const withoutOptimistic = prev.filter(
              (msg) =>
                !msg.id.startsWith("temp-") ||
                msg.content !== newMessage.content
            )
            return [...withoutOptimistic, newMessage]
          }
          return [...prev, newMessage]
        })

        if (data.senderId !== currentUserId) {
          markConversationAsRead({ conversationId: conversation.id }).catch(
            () => {}
          )
        }
      }
    })

    const unsubscribeMessageUpdated = socketService.on(
      "message:updated",
      (data) => {
        setMessages((prev) =>
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
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.messageId
              ? { ...msg, isDeleted: true, deletedAt: new Date(data.deletedAt) }
              : msg
          )
        )
      }
    )

    const unsubscribeReaction = socketService.on("message:reaction", (data) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === data.messageId) {
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
            } else {
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
            }
          }
          return msg
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

    return () => {
      unsubscribeNewMessage()
      unsubscribeMessageUpdated()
      unsubscribeMessageDeleted()
      unsubscribeReaction()
      unsubscribeTypingStart()
      unsubscribeTypingStop()
      socketService.unsubscribeFromConversation(conversation.id)
    }
  }, [conversation.id, currentUserId])

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

  // Polling fallback when Socket.IO is not connected
  useEffect(() => {
    if (socketService.isConnected()) return

    let active = true
    const poll = async () => {
      if (!active) return
      const lastMessage = messages[messages.length - 1]
      if (!lastMessage) return
      const result = await pollNewMessages({
        conversationId: conversation.id,
        afterMessageId: lastMessage.id,
      })
      if (result.success && result.data.items.length > 0) {
        setMessages((prev) => [...prev, ...result.data.items])
        markConversationAsRead({ conversationId: conversation.id }).catch(
          () => {}
        )
      }
    }

    const timer = setInterval(poll, 5000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [conversation.id, messages.length])

  const handleSendMessage = async (content: string, replyToId?: string) => {
    try {
      await onSendMessage(content, replyToId)
      setReplyTo(null)
      setEditingMessage(null)
    } catch {
      toast({
        title: m?.notifications?.error || "Error",
        description: m?.errors?.send_failed || "Failed to send message",
      })
    }
  }

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

  const handleToggleWhatsApp = async () => {
    setIsTogglingWhatsApp(true)
    try {
      const result = await toggleConversationWhatsApp({
        conversationId: conversation.id,
        enabled: !whatsappEnabled,
      })
      if (result.success) {
        setWhatsappEnabled(result.data.enabled)
      } else {
        toast({
          title: m?.notifications?.error || "Error",
          description: result.error,
        })
      }
    } catch {
      toast({
        title: m?.notifications?.error || "Error",
        description: "Failed to toggle WhatsApp",
      })
    } finally {
      setIsTogglingWhatsApp(false)
    }
  }

  const currentParticipant = conversation.participants?.find(
    (p) => p.userId === currentUserId
  )
  const canSendMessages = currentParticipant?.role !== "read_only"

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Header — WhatsApp style: 60px, avatar, name, status, actions */}
      <div className="bg-msg-header-bg border-border flex h-[60px] flex-shrink-0 items-center gap-3 border-b px-3">
        {/* Back arrow — mobile only */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-10 w-10 flex-shrink-0 rounded-full md:hidden"
          aria-label={m?.ui?.back || "Back"}
        >
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
        </Button>

        {/* Avatar */}
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback className="bg-muted text-muted-foreground">
            {avatarFallback}
          </AvatarFallback>
        </Avatar>

        {/* Name + status */}
        <div className="min-w-0 flex-1">
          <h2 className="text-foreground flex items-center gap-1.5 truncate font-medium">
            {displayName}
            {whatsappEnabled && (
              <span
                className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full bg-green-500"
                title="WhatsApp"
              />
            )}
          </h2>
          {typingUsers.length > 0 ? (
            <p className="text-msg-unread-badge text-xs">
              {typingUsers.length === 1
                ? `${typingUsers[0].user.username || m?.ui?.someone || "Someone"} ${m?.ui?.is_typing || "is typing..."}`
                : `${typingUsers.length} ${m?.ui?.are_typing || "are typing..."}`}
            </p>
          ) : conversation.type !== "direct" && participantNames ? (
            <p className="text-muted-foreground truncate text-xs">
              {participantNames}
              {(conversation.participantCount ?? 0) > 3 &&
                ` +${(conversation.participantCount ?? 0) - 3}`}
            </p>
          ) : conversation.type === "direct" ? (
            <p
              className={cn(
                "text-xs",
                otherPresence.state === "online"
                  ? "text-msg-unread-badge"
                  : "text-muted-foreground"
              )}
            >
              {otherPresence.state === "online"
                ? m?.ui?.online || "online"
                : otherPresence.state === "offline"
                  ? `${m?.ui?.last_seen || "last seen"} ${formatDistanceToNow(otherPresence.lastSeenAt, { addSuffix: true, locale: dateLocale })}`
                  : m?.ui?.online || "online"}
            </p>
          ) : null}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-0.5">
          <MessageSearch conversationId={conversation.id} locale={locale} />
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
              <DropdownMenuItem onClick={onViewDetails}>
                <Info className="me-2 h-4 w-4" />
                {m?.ui?.details || "Details"}
              </DropdownMenuItem>
              {conversation.type !== "direct" && (
                <DropdownMenuItem onClick={onViewParticipants}>
                  <Users className="me-2 h-4 w-4" />
                  {m?.ui?.members_label || "Members"}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleToggleWhatsApp}
                disabled={
                  isTogglingWhatsApp || (!whatsappEnabled && !whatsappConnected)
                }
              >
                <span
                  className={cn(
                    "me-2 inline-block h-3 w-3 rounded-full",
                    whatsappEnabled ? "bg-green-500" : "bg-muted-foreground"
                  )}
                />
                {whatsappEnabled
                  ? m?.whatsapp?.enabled || "WhatsApp On"
                  : whatsappConnected
                    ? m?.whatsapp?.enable || "Enable WhatsApp"
                    : m?.whatsapp?.disconnected || "WhatsApp Disconnected"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <Phone className="me-2 h-4 w-4" />
                {m?.ui?.voice_call || "Voice call"}
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Video className="me-2 h-4 w-4" />
                {m?.ui?.video_call || "Video call"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div className="relative flex-1 overflow-hidden">
        <MessageList
          messages={optimisticMessages}
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
          className="h-full"
        />

        {/* Typing indicator — WhatsApp bouncing dots bubble */}
        {typingUsers.length > 0 && (
          <div className="absolute start-4 bottom-2 z-10">
            <div className="bg-msg-incoming flex items-center gap-1 rounded-lg rounded-ss-sm px-3 py-2 shadow-sm">
              <span
                className="bg-msg-typing-dot h-2 w-2 animate-bounce rounded-full"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="bg-msg-typing-dot h-2 w-2 animate-bounce rounded-full"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="bg-msg-typing-dot h-2 w-2 animate-bounce rounded-full"
                style={{ animationDelay: "300ms" }}
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
