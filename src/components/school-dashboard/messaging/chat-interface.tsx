"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { ArrowLeft } from "lucide-react"

import { cn } from "@/lib/utils"
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

import { toggleConversationWhatsApp } from "./actions"
import { CONVERSATION_TYPE_CONFIG } from "./config"
import { resolveMessagingError } from "./errors"
import { useUserPresence } from "./hooks/use-presence"
import { MessageInput } from "./message-input"
import { MessageList, MessageListSkeleton } from "./message-list"
import type { ConversationDTO, MessageAttachmentDTO, MessageDTO } from "./types"

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
  /** Someone else is typing in this thread. */
  isTyping?: boolean
  onEditMessage: (messageId: string, content: string) => Promise<void>
  onDeleteMessage: (messageId: string) => Promise<void>
  onReactToMessage: (messageId: string, emoji: string) => Promise<void>
  onRemoveReaction: (reactionId: string) => Promise<void>
  onFileUpload?: (files: UploadedFileResult[]) => void
  onLoadMoreMessages?: () => Promise<void>
  /**
   * The outbox, owned by the orchestrator so both widths share one: an
   * optimistic row goes in, is confirmed or failed by nonce, and a failed
   * one can be retried from its bubble.
   */
  onOptimisticSend: (
    content: string,
    replyToId?: string,
    attachments?: MessageAttachmentDTO[]
  ) => string
  onMessageConfirmed: (
    nonce: string,
    messageId: string,
    serverMessage?: MessageDTO
  ) => void
  onMessageFailed: (nonce: string) => void
  onRetryMessage: (messageId: string) => void
  onTypingStart?: () => void
  onTypingStop?: () => void
  onViewParticipants?: () => void
  onViewDetails?: () => void
  onBack?: () => void
  onSaveScrollPosition?: (position: number) => void
  savedScrollPosition?: number
  className?: string
}

/**
 * The desktop thread: header, list, composer. A view — the socket room,
 * the polling fallback and mark-as-read that used to run in here now run
 * once in the orchestrator (`useThreadSync`), where the phone's thread can
 * share them instead of depending on this component being mounted and
 * hidden beside it.
 */
export function ChatInterface({
  conversation,
  messages,
  hasMoreMessages,
  currentUserId,
  locale = "en",
  isConnected,
  whatsappConnected = false,
  isTyping = false,
  onEditMessage,
  onDeleteMessage,
  onReactToMessage,
  onRemoveReaction,
  onFileUpload,
  onLoadMoreMessages,
  onOptimisticSend,
  onMessageConfirmed,
  onMessageFailed,
  onRetryMessage,
  onTypingStart,
  onTypingStop,
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
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [whatsappEnabled, setWhatsappEnabled] = useState(
    conversation.whatsappEnabled ?? false
  )
  // `isConnected` only informs the header today; the sync lives upstream.
  void isConnected
  void onEditMessage
  void editingMessage

  // Track conversation changes without full remount
  const prevConvIdRef = useRef(conversation.id)
  useEffect(() => {
    if (prevConvIdRef.current !== conversation.id) {
      // Conversation changed — reset local UI state
      setReplyTo(null)
      setEditingMessage(null)
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
          description: resolveMessagingError(result.error, m),
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

  // Participant names for subtitle
  const participantNames =
    conversation.type !== "direct"
      ? conversation.participants
          ?.filter((p) => p.userId !== currentUserId)
          .slice(0, 3)
          .map((p) => p.user.username || p.user.email?.split("@")[0])
          .join(", ")
      : null

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

  const currentParticipant = conversation.participants?.find(
    (p) => p.userId === currentUserId
  )
  const canSendMessages = currentParticipant?.role !== "read_only"

  // Compute avatar color once per conversation/user — getAvatarColor hashes a
  // string, so calling it 4× per render for the same id is pure waste.
  const avatarColor = useMemo(
    () => getAvatarColor(otherUserId || conversation.id),
    [otherUserId, conversation.id]
  )

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Header */}
      <div
        className={cn(
          "flex h-[60px] flex-shrink-0 items-center gap-[10px] px-3",
          // Same glass panel and hairline the mobile conversation header uses.
          "bg-[color:var(--wa-surface-panel)] backdrop-blur-[25px]",
          "border-b-[0.33px] border-[color:var(--wa-border-panel)]"
        )}
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
              <Avatar className="h-9 w-9 cursor-pointer">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback
                  className="flex items-center justify-center"
                  style={{
                    backgroundColor: avatarColor.bg,
                  }}
                >
                  <UserFilledIcon
                    className="h-4 w-4"
                    style={{
                      color: avatarColor.icon,
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
                    backgroundColor: avatarColor.bg,
                  }}
                >
                  <UserFilledIcon
                    className="h-10 w-10"
                    style={{
                      color: avatarColor.icon,
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

        {/* Name + presence — opens the info panel, as tapping the name does
            on the phone. Falls back to the same "tap for info" subtitle when
            there is no presence to report. */}
        <button
          type="button"
          onClick={onViewDetails}
          className="flex min-w-0 flex-1 flex-col items-start text-start"
        >
          <span className="max-w-full truncate text-[16px] font-semibold tracking-[-0.32px] text-[color:var(--wa-text-primary)]">
            {displayName}
          </span>
          <p className="max-w-full truncate text-[12px] tracking-[-0.12px] text-[color:var(--wa-text-secondary-alpha)]">
            {conversation.type === "direct" && otherPresence.state === "online"
              ? m?.ui?.online || "online"
              : conversation.type === "direct" &&
                  otherPresence.state === "offline"
                ? `${m?.ui?.last_seen || "last seen"} ${formatDistanceToNow(
                    new Date(otherPresence.lastSeenAt),
                    { addSuffix: true, locale: dateLocale }
                  )}`
                : participantNames}
          </p>
        </button>

        {/* Action icons. Video/voice call buttons removed — no telephony
            backend exists; decorative no-op buttons don't ship to production. */}
        <div className="flex items-center gap-0.5">
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
          onRetry={onRetryMessage}
          savedScrollPosition={savedScrollPosition}
          onSaveScrollPosition={onSaveScrollPosition}
          unreadCount={conversation.unreadCount ?? 0}
          encryptionNotice={m?.ui?.encryption_notice}
          encryptionLearnMore={m?.ui?.encryption_learn_more}
          onEncryptionLearnMore={onViewDetails}
          className="h-full"
        />

        {/* Typing indicator — WhatsApp bouncing dots bubble */}
        {isTyping && (
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
          onTypingStart={onTypingStart}
          onTypingStop={onTypingStop}
          onOptimisticSend={onOptimisticSend}
          onMessageConfirmed={onMessageConfirmed}
          onMessageFailed={onMessageFailed}
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
