"use client"

import { useCallback, useEffect, useOptimistic, useState } from "react"
import {
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
import { toast } from "@/components/ui/use-toast"
import type { UploadedFileResult } from "@/components/file"

import { CONVERSATION_TYPE_CONFIG } from "./config"
import { MessageInput } from "./message-input"
import { MessageList, MessageListSkeleton } from "./message-list"
import { MessageSearch } from "./message-search"
import type { ConversationDTO, MessageDTO, TypingIndicatorDTO } from "./types"

export interface ChatInterfaceProps {
  conversation: ConversationDTO
  initialMessages: MessageDTO[]
  currentUserId: string
  locale?: "ar" | "en"
  onSendMessage: (content: string, replyToId?: string) => Promise<void>
  onEditMessage: (messageId: string, content: string) => Promise<void>
  onDeleteMessage: (messageId: string) => Promise<void>
  onReactToMessage: (messageId: string, emoji: string) => Promise<void>
  onRemoveReaction: (reactionId: string) => Promise<void>
  onFileUpload?: (files: UploadedFileResult[]) => void
  onLoadMoreMessages?: () => Promise<void>
  onViewParticipants?: () => void
  onViewDetails?: () => void
  hasMoreMessages?: boolean
  className?: string
}

export function ChatInterface({
  conversation,
  initialMessages,
  currentUserId,
  locale = "en",
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onReactToMessage,
  onRemoveReaction,
  onFileUpload,
  onLoadMoreMessages,
  onViewParticipants,
  onViewDetails,
  hasMoreMessages = false,
  className,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<MessageDTO[]>(initialMessages)
  const [replyTo, setReplyTo] = useState<MessageDTO | null>(null)
  const [editingMessage, setEditingMessage] = useState<MessageDTO | null>(null)
  const [typingUsers, setTypingUsers] = useState<TypingIndicatorDTO[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  // Optimistic updates layer (React 19 pattern)
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage: MessageDTO) => [...state, newMessage]
  )

  // Handle optimistic message sending
  const handleOptimisticSend = useCallback(
    (content: string, replyToId?: string) => {
      const optimisticMessage: MessageDTO = {
        id: `temp-${Date.now()}`, // Temporary ID
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
        status: "sending", // Special status for optimistic messages
        replyToId: replyToId || null,
        replyTo: replyToId
          ? messages.find((m) => m.id === replyToId) || null
          : null,
        isEdited: false,
        editedAt: null,
        isDeleted: false,
        deletedAt: null,
        isSystem: false,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        attachments: [],
        reactions: [],
        readReceipts: [],
        readCount: 0,
      }

      // Add to optimistic state
      addOptimisticMessage(optimisticMessage)
    },
    [conversation.id, currentUserId, messages, addOptimisticMessage]
  )

  const config = CONVERSATION_TYPE_CONFIG[conversation.type]
  const Icon = config.icon

  // Get display name and avatar for header
  const otherUser =
    conversation.type === "direct"
      ? conversation.participants?.find((p) => p.userId !== currentUserId)?.user
      : null

  const displayName =
    conversation.type === "direct" && otherUser
      ? otherUser.username ||
        otherUser.email ||
        (locale === "ar" ? "مستخدم" : "User")
      : conversation.title || config.label

  const avatarUrl =
    conversation.type === "direct" && otherUser
      ? otherUser.image || undefined
      : conversation.avatar || undefined

  const avatarFallback = displayName?.[0]?.toUpperCase() || "C"

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (!socketService.isConnected()) return

    // Subscribe to conversation
    socketService.subscribeToConversation(conversation.id)

    // Listen for new messages
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
          isEdited: false,
          editedAt: null,
          isDeleted: false,
          deletedAt: null,
          isSystem: false,
          metadata: null,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.createdAt),
          attachments: [],
          reactions: [],
          readReceipts: [],
          readCount: 0,
        }

        // Replace optimistic message or add new message
        setMessages((prev) => {
          // If this is from current user, it might be replacing an optimistic message
          if (data.senderId === currentUserId) {
            // Find and remove any temporary message with matching content
            const withoutOptimistic = prev.filter(
              (msg) =>
                !msg.id.startsWith("temp-") ||
                msg.content !== newMessage.content
            )
            return [...withoutOptimistic, newMessage]
          }
          // From another user, just add it
          return [...prev, newMessage]
        })

        // Mark as read if from another user
        if (data.senderId !== currentUserId) {
          // Call mark as read action
        }
      }
    })

    // Listen for message updates
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

    // Listen for message deletions
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

    // Listen for reactions
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

    // Listen for typing indicators
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

  // Auto-remove typing indicators after 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers((prev) => {
        const now = new Date().getTime()
        return prev.filter((u) => now - new Date(u.startedAt).getTime() < 5000)
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleSendMessage = async (content: string, replyToId?: string) => {
    try {
      await onSendMessage(content, replyToId)
      setReplyTo(null)
      setEditingMessage(null)
    } catch (error) {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar" ? "فشل إرسال الرسالة" : "Failed to send message",
      })
    }
  }

  const handleEditMessage = async (message: MessageDTO) => {
    // TODO: Implement edit UI
    setEditingMessage(message)
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await onDeleteMessage(messageId)
    } catch (error) {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar" ? "فشل حذف الرسالة" : "Failed to delete message",
      })
    }
  }

  const handleReactToMessage = async (messageId: string, emoji: string) => {
    try {
      await onReactToMessage(messageId, emoji)
    } catch (error) {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar" ? "فشل إضافة التفاعل" : "Failed to add reaction",
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

  // Get current user's participant role
  const currentParticipant = conversation.participants?.find(
    (p) => p.userId === currentUserId
  )
  const canSendMessages = currentParticipant?.role !== "read_only"

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Header */}
      <div className="border-border bg-background flex items-center justify-between gap-3 border-b p-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-muted text-muted-foreground">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h2 className="text-foreground truncate font-semibold">
              {displayName}
            </h2>
            {conversation.type !== "direct" && (
              <p className="text-muted-foreground text-sm">
                {conversation.participantCount}{" "}
                {locale === "ar" ? "عضو" : "members"}
              </p>
            )}
            {typingUsers.length > 0 && (
              <p className="text-muted-foreground text-sm italic">
                {typingUsers.length === 1
                  ? `${typingUsers[0].user.username} ${locale === "ar" ? "يكتب..." : "is typing..."}`
                  : `${typingUsers.length} ${locale === "ar" ? "يكتبون..." : "are typing..."}`}
              </p>
            )}
          </div>
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-2">
          {/* Message Search */}
          <MessageSearch conversationId={conversation.id} locale={locale} />

          {conversation.type !== "direct" && (
            <Button variant="ghost" size="icon" onClick={onViewParticipants}>
              <Users className="h-5 w-5" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <EllipsisVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onViewDetails}>
                <Info className="me-2 h-4 w-4" />
                {locale === "ar" ? "التفاصيل" : "Details"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <Phone className="me-2 h-4 w-4" />
                {locale === "ar" ? "مكالمة صوتية" : "Voice call"}
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Video className="me-2 h-4 w-4" />
                {locale === "ar" ? "مكالمة فيديو" : "Video call"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={optimisticMessages}
        currentUserId={currentUserId}
        locale={locale}
        isLoading={isLoadingMessages}
        hasMore={hasMoreMessages}
        onLoadMore={handleLoadMore}
        onReply={setReplyTo}
        onEdit={handleEditMessage}
        onDelete={handleDeleteMessage}
        onReact={handleReactToMessage}
        onRemoveReaction={onRemoveReaction}
        className="flex-1"
      />

      {/* Input */}
      {canSendMessages ? (
        <MessageInput
          conversationId={conversation.id}
          locale={locale}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onFileUpload={onFileUpload}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
          onOptimisticSend={handleOptimisticSend}
        />
      ) : (
        <div className="text-muted-foreground bg-muted/50 p-4 text-center text-sm">
          {locale === "ar"
            ? "ليس لديك صلاحية لإرسال رسائل في هذه المحادثة"
            : "You don't have permission to send messages in this conversation"}
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
      <div className="border-border flex items-center gap-3 border-b p-4">
        <div className="bg-muted h-10 w-10 animate-pulse rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="bg-muted h-4 w-32 animate-pulse rounded" />
          <div className="bg-muted h-3 w-24 animate-pulse rounded" />
        </div>
      </div>
      <MessageListSkeleton locale={locale} />
      <div className="border-border border-t p-4">
        <div className="bg-muted h-10 animate-pulse rounded" />
      </div>
    </div>
  )
}
