"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

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
  pollConversationUpdates,
  removeReaction,
  sendMessage,
} from "./actions"
import { ChatInterface } from "./chat-interface"
import { ContactsPanel } from "./contacts/contacts-panel"
import { ConversationInfoPanel } from "./conversation-info-panel"
import { NoActiveConversation } from "./empty-state"
import type { ConversationDTO, MessageDTO } from "./types"

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
  const router = useRouter()
  const { dictionary } = useDictionary()
  const m = dictionary?.messaging
  const [conversations, setConversations] =
    useState<ConversationDTO[]>(initialConversations)
  const [activeConversation, setActiveConversation] =
    useState<ConversationDTO | null>(initialActiveConversation)
  const [messages, setMessages] = useState<MessageDTO[]>(initialMessages)
  const [isConnected, setIsConnected] = useState(false)
  const [showInfoPanel, setShowInfoPanel] = useState(false)

  // Sync state with server props on navigation (router.refresh)
  const prevActiveId = useRef(initialActiveConversation?.id)
  useEffect(() => {
    if (initialActiveConversation?.id !== prevActiveId.current) {
      prevActiveId.current = initialActiveConversation?.id
      setActiveConversation(initialActiveConversation)
      setMessages(initialMessages)
    }
  }, [initialActiveConversation, initialMessages])

  useEffect(() => {
    setConversations(initialConversations)
  }, [initialConversations])

  // Derive the active contact's userId for sidebar highlight
  const activeContactUserId = activeConversation?.participants?.find(
    (p) => p.userId !== currentUserId
  )?.userId

  // Connect to Socket.IO
  useEffect(() => {
    const connect = async () => {
      try {
        const connected = socketService.isConnected()
        setIsConnected(connected)
        if (connected) {
          socketService.subscribeToConversations(currentUserId)
        }
      } catch (error) {
        console.error("Failed to connect to Socket.IO:", error)
        setIsConnected(false)
      }
    }

    connect()

    return () => {
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

  // Listen for conversation updates
  useEffect(() => {
    if (!isConnected) return

    const unsubscribeConversationNew = socketService.on(
      "conversation:new",
      (data) => {
        setConversations((prev) => [
          {
            id: data.id,
            schoolId: "",
            type: data.type as any,
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

    return () => {
      unsubscribeConversationNew()
      unsubscribeConversationUpdated()
    }
  }, [isConnected])

  const [hasMoreMessages, setHasMoreMessages] = useState(
    initialMessages.length >= 50
  )

  const handleBack = () => {
    setActiveConversation(null)
    setMessages([])
    setHasMoreMessages(false)
    setShowInfoPanel(false)
    window.history.replaceState(null, "", `/${locale}/messages`)
  }

  const handleSendMessage = async (
    content: string,
    replyToId?: string
  ): Promise<MessageDTO | void> => {
    if (!activeConversation) return

    const result = await sendMessage({
      conversationId: activeConversation.id,
      content,
      contentType: "text",
      replyToId,
    })

    if (!result.success) {
      throw new Error(result.error)
    }

    return result.data.message as MessageDTO
  }

  const handleEditMessage = async (messageId: string, content: string) => {
    const result = await editMessage({ messageId, content })
    if (!result.success) {
      throw new Error(result.error)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    const result = await deleteMessage({ messageId })
    if (!result.success) {
      throw new Error(result.error)
    }
  }

  const handleReactToMessage = async (messageId: string, emoji: string) => {
    const result = await addReaction({ messageId, emoji })
    if (!result.success) {
      throw new Error(result.error)
    }
  }

  const handleRemoveReaction = async (reactionId: string) => {
    const result = await removeReaction({ reactionId })
    if (!result.success) {
      throw new Error(result.error)
    }
  }

  const switchToConversation = async (conversationId: string) => {
    const result = await fetchConversationData({ conversationId })
    if (result.success) {
      setActiveConversation(result.data.conversation)
      setMessages(result.data.messages)
      setHasMoreMessages(result.data.hasMore)
      window.history.replaceState(
        null,
        "",
        `/${locale}/messages?conversation=${conversationId}`
      )
    }
  }

  const handleContactClick = async (userId: string) => {
    try {
      const result = await createConversation({
        type: "direct",
        participantIds: [userId],
      })
      if (result.success) {
        await switchToConversation(result.data.id)
      } else {
        toast({
          title: m?.notifications?.error || "Error",
          description:
            ("error" in result && result.error) ||
            m?.errors?.conversation_start_failed ||
            "Failed to start conversation",
        })
      }
    } catch {
      toast({
        title: m?.notifications?.error || "Error",
        description:
          m?.errors?.conversation_start_failed ||
          "Failed to start conversation",
      })
    }
  }

  const handleLoadMoreMessages = async () => {
    if (!activeConversation || messages.length === 0) return
    const oldestMessage = messages[0]
    const result = await loadMoreMessages({
      conversationId: activeConversation.id,
      cursor: oldestMessage.id,
      take: 50,
      direction: "before",
    })
    if (result.success) {
      setMessages((prev) => [...result.data.items, ...prev])
      setHasMoreMessages(result.data.hasMore)
    }
  }

  return (
    <div className="bg-msg-chat-bg relative flex h-full">
      {/* Sidebar — unified contact list */}
      <div
        className={cn(
          "bg-msg-sidebar-bg border-border flex min-h-0 flex-shrink-0 flex-col overflow-hidden border-e",
          "w-full md:w-[350px] md:max-w-[30vw]",
          activeConversation ? "hidden md:flex" : "flex"
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
            key={activeConversation.id}
            conversation={activeConversation}
            initialMessages={messages}
            currentUserId={currentUserId}
            locale={locale}
            whatsappConnected={whatsappConnected}
            onSendMessage={handleSendMessage}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onReactToMessage={handleReactToMessage}
            onRemoveReaction={handleRemoveReaction}
            onLoadMoreMessages={handleLoadMoreMessages}
            hasMoreMessages={hasMoreMessages}
            onBack={handleBack}
            onViewDetails={() => setShowInfoPanel(!showInfoPanel)}
            onViewParticipants={() => setShowInfoPanel(true)}
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
