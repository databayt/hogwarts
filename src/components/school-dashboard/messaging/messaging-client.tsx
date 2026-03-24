"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MessageSquarePlus, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import socketService from "@/lib/websocket/socket-service"
import { toast } from "@/components/ui/use-toast"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import {
  addReaction,
  archiveConversation,
  createConversation,
  deleteMessage,
  editMessage,
  leaveConversation,
  markConversationAsRead,
  markMessageAsRead,
  muteConversation,
  pinConversation,
  removeReaction,
  sendMessage,
  unmuteConversation,
} from "./actions"
import { ChatInterface, ChatInterfaceSkeleton } from "./chat-interface"
import { ContactsPanel } from "./contacts/contacts-panel"
import { ConversationList } from "./conversation-list"
import { NoActiveConversation } from "./empty-state"
import { NewConversationDialog } from "./new-conversation-dialog"
import type { ConversationDTO, MessageDTO } from "./types"

type SidebarTab = "chats" | "contacts"

export interface MessagingClientProps {
  initialConversations: ConversationDTO[]
  initialActiveConversation: ConversationDTO | null
  initialMessages: MessageDTO[]
  currentUserId: string
  currentUserRole: string
  locale?: "ar" | "en"
}

export function MessagingClient({
  initialConversations,
  initialActiveConversation,
  initialMessages,
  currentUserId,
  currentUserRole,
  locale = "en",
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
  const [showNewConversationDialog, setShowNewConversationDialog] =
    useState(false)
  const [activeTab, setActiveTab] = useState<SidebarTab>("chats")

  // Connect to Socket.IO
  useEffect(() => {
    const connect = async () => {
      try {
        setIsConnected(true)
        socketService.subscribeToConversations(currentUserId)
      } catch (error) {
        console.error("Failed to connect to Socket.IO:", error)
      }
    }

    connect()

    return () => {
      socketService.unsubscribeFromConversations(currentUserId)
    }
  }, [currentUserId])

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

  const handleConversationClick = (conversationId: string) => {
    router.push(`/messages?conversation=${conversationId}`)
  }

  const handleBack = () => {
    router.push("/messages")
  }

  const handleNewConversation = () => {
    setShowNewConversationDialog(true)
  }

  const handleConversationCreated = (conversationId: string) => {
    router.push(`/messages?conversation=${conversationId}`)
    router.refresh()
  }

  const handleSendMessage = async (content: string, replyToId?: string) => {
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

  const handleArchiveConversation = async (conversationId: string) => {
    const result = await archiveConversation({ conversationId })

    if (result.success) {
      setConversations((prev) => prev.filter((c) => c.id !== conversationId))
      if (activeConversation?.id === conversationId) {
        setActiveConversation(null)
        router.push("/messages")
      }
      toast({
        title: m?.notifications?.archived || "Archived",
        description:
          m?.notifications?.archived_success ||
          "Conversation archived successfully",
      })
    } else {
      toast({
        title: m?.notifications?.error || "Error",
        description: result.error,
      })
    }
  }

  const handleDeleteConversation = async (conversationId: string) => {
    const result = await leaveConversation({ conversationId })

    if (result.success) {
      setConversations((prev) => prev.filter((c) => c.id !== conversationId))
      if (activeConversation?.id === conversationId) {
        setActiveConversation(null)
        router.push("/messages")
      }
      toast({
        title: m?.notifications?.deleted || "Deleted",
        description:
          m?.notifications?.deleted_success ||
          "Conversation deleted successfully",
      })
    } else {
      toast({
        title: m?.notifications?.error || "Error",
        description: result.error,
      })
    }
  }

  const handlePinConversation = async (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId)
    const currentParticipant = conversation?.participants?.find(
      (p) => p.userId === currentUserId
    )
    const isPinned = currentParticipant?.isPinned ?? false

    const result = await pinConversation({
      conversationId,
      isPinned: !isPinned,
    })

    if (result.success) {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === conversationId) {
            return {
              ...c,
              participants: c.participants?.map((p) =>
                p.userId === currentUserId ? { ...p, isPinned: !isPinned } : p
              ),
            }
          }
          return c
        })
      )
      toast({
        title: isPinned
          ? m?.notifications?.unpinned || "Unpinned"
          : m?.notifications?.pinned || "Pinned",
        description: isPinned
          ? m?.notifications?.unpinned_success || "Conversation unpinned"
          : m?.notifications?.pinned_success || "Conversation pinned",
      })
    } else {
      toast({
        title: m?.notifications?.error || "Error",
        description: result.error,
      })
    }
  }

  const handleMuteConversation = async (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId)
    const currentParticipant = conversation?.participants?.find(
      (p) => p.userId === currentUserId
    )
    const isMuted = currentParticipant?.isMuted ?? false

    let result
    if (isMuted) {
      result = await unmuteConversation({ conversationId })
    } else {
      result = await muteConversation({ conversationId })
    }

    if (result.success) {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === conversationId) {
            return {
              ...c,
              participants: c.participants?.map((p) =>
                p.userId === currentUserId ? { ...p, isMuted: !isMuted } : p
              ),
            }
          }
          return c
        })
      )
      toast({
        title: isMuted
          ? m?.notifications?.unmuted || "Unmuted"
          : m?.notifications?.muted || "Muted",
        description: isMuted
          ? m?.notifications?.unmuted_success || "Conversation unmuted"
          : m?.notifications?.muted_success || "Conversation muted",
      })
    } else {
      toast({
        title: m?.notifications?.error || "Error",
        description: result.error,
      })
    }
  }

  const handleContactClick = async (userId: string) => {
    try {
      const result = await createConversation({
        type: "direct",
        participantIds: [userId],
      })
      if (result.success) {
        setActiveTab("chats")
        router.push(`/messages?conversation=${result.data.id}`)
        router.refresh()
      } else {
        toast({
          title: m?.notifications?.error || "Error",
          description: result.error || "Failed to start conversation",
        })
      }
    } catch {
      toast({
        title: m?.notifications?.error || "Error",
        description: "Failed to start conversation",
      })
    }
  }

  return (
    <div className="bg-msg-chat-bg relative flex h-[calc(100vh-4rem)]">
      {/* Sidebar — hidden on mobile when conversation active */}
      <div
        className={cn(
          "bg-msg-sidebar-bg border-border flex min-h-0 flex-shrink-0 flex-col overflow-hidden border-e",
          "w-full md:w-[420px] md:max-w-[35vw]",
          activeConversation ? "hidden md:flex" : "flex"
        )}
      >
        {/* Tab bar: Chats | Contacts */}
        <div className="border-border flex shrink-0 border-b px-3 pt-3 pb-0">
          <button
            onClick={() => setActiveTab("chats")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-t-lg px-3 py-2 text-sm font-medium transition-colors",
              activeTab === "chats"
                ? "bg-msg-hover text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageSquarePlus className="h-4 w-4" />
            {m?.contacts?.tab_chats ??
              (locale === "ar" ? "المحادثات" : "Chats")}
          </button>
          <button
            onClick={() => setActiveTab("contacts")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-t-lg px-3 py-2 text-sm font-medium transition-colors",
              activeTab === "contacts"
                ? "bg-msg-hover text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Users className="h-4 w-4" />
            {m?.contacts?.tab_contacts ??
              (locale === "ar" ? "جهات الاتصال" : "Contacts")}
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "chats" ? (
          <ConversationList
            conversations={conversations}
            currentUserId={currentUserId}
            locale={locale}
            activeConversationId={activeConversation?.id}
            onConversationClick={handleConversationClick}
            onNewConversation={handleNewConversation}
            onArchive={handleArchiveConversation}
            onDelete={handleDeleteConversation}
            onPin={handlePinConversation}
            onMute={handleMuteConversation}
          />
        ) : (
          <ContactsPanel
            currentUserRole={currentUserRole}
            locale={locale}
            onContactClick={handleContactClick}
          />
        )}
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
            initialMessages={messages}
            currentUserId={currentUserId}
            locale={locale}
            onSendMessage={handleSendMessage}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onReactToMessage={handleReactToMessage}
            onRemoveReaction={handleRemoveReaction}
            onBack={handleBack}
          />
        ) : (
          <NoActiveConversation
            locale={locale}
            onNewConversation={handleNewConversation}
          />
        )}
      </div>

      {/* FAB — mobile only, when on conversation list */}
      {!activeConversation && (
        <button
          onClick={handleNewConversation}
          className="bg-msg-unread-badge fixed end-6 bottom-6 z-30 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-95 md:hidden"
          aria-label={m?.ui?.new_conversation || "New conversation"}
        >
          <MessageSquarePlus className="h-6 w-6" />
        </button>
      )}

      {/* New Conversation Dialog */}
      <NewConversationDialog
        open={showNewConversationDialog}
        onOpenChange={setShowNewConversationDialog}
        locale={locale}
        currentUserId={currentUserId}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  )
}
