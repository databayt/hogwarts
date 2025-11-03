"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { ConversationDTO, MessageDTO } from "./types"
import { ConversationList } from "./conversation-list"
import { ChatInterface, ChatInterfaceSkeleton } from "./chat-interface"
import {
  sendMessage,
  editMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  archiveConversation,
  markMessageAsRead,
  markConversationAsRead,
} from "./actions"
import { toast } from "@/components/ui/use-toast"
import socketService from "@/lib/websocket/socket-service"

export interface MessagingClientProps {
  initialConversations: ConversationDTO[]
  initialActiveConversation: ConversationDTO | null
  initialMessages: MessageDTO[]
  currentUserId: string
  locale?: "ar" | "en"
}

export function MessagingClient({
  initialConversations,
  initialActiveConversation,
  initialMessages,
  currentUserId,
  locale = "en",
}: MessagingClientProps) {
  const router = useRouter()
  const [conversations, setConversations] = useState<ConversationDTO[]>(initialConversations)
  const [activeConversation, setActiveConversation] = useState<ConversationDTO | null>(
    initialActiveConversation
  )
  const [messages, setMessages] = useState<MessageDTO[]>(initialMessages)
  const [isConnected, setIsConnected] = useState(false)

  // Connect to Socket.IO
  useEffect(() => {
    const connect = async () => {
      try {
        // Connection params will be handled by socket-service from session
        // await socketService.connect(schoolId, currentUserId, userRole)
        setIsConnected(true)

        // Subscribe to user's conversations
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

    const unsubscribeConversationNew = socketService.on("conversation:new", (data) => {
      // Add new conversation to list
      setConversations(prev => [
        {
          id: data.id,
          schoolId: "",
          type: data.type as any,
          title: data.title,
          description: null,
          avatarUrl: null,
          directParticipant1Id: null,
          directParticipant2Id: null,
          lastMessageAt: new Date(),
          isArchived: false,
          createdById: "",
          createdBy: { id: "", username: null, email: null, image: null },
          metadata: null,
          participantCount: data.participantIds.length,
          unreadCount: 0,
          lastMessage: null,
          participants: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        ...prev,
      ])
    })

    const unsubscribeConversationUpdated = socketService.on("conversation:updated", (data) => {
      setConversations(prev => prev.map(conv =>
        conv.id === data.conversationId
          ? { ...conv, ...data.updates }
          : conv
      ))
    })

    return () => {
      unsubscribeConversationNew()
      unsubscribeConversationUpdated()
    }
  }, [isConnected])

  const handleConversationClick = (conversationId: string) => {
    router.push(`/messages?conversation=${conversationId}`)
  }

  const handleNewConversation = () => {
    // TODO: Open new conversation dialog
    toast({
      title: locale === "ar" ? "قريباً" : "Coming soon",
      description: locale === "ar" ? "ميزة إنشاء محادثة جديدة قريباً" : "New conversation feature coming soon",
    })
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

    // Message will be added via Socket.IO event
  }

  const handleEditMessage = async (messageId: string, content: string) => {
    const result = await editMessage({ messageId, content })

    if (!result.success) {
      throw new Error(result.error)
    }

    // Update will be applied via Socket.IO event
  }

  const handleDeleteMessage = async (messageId: string) => {
    const result = await deleteMessage({ messageId })

    if (!result.success) {
      throw new Error(result.error)
    }

    // Deletion will be applied via Socket.IO event
  }

  const handleReactToMessage = async (messageId: string, emoji: string) => {
    const result = await addReaction({ messageId, emoji })

    if (!result.success) {
      throw new Error(result.error)
    }

    // Reaction will be added via Socket.IO event
  }

  const handleRemoveReaction = async (reactionId: string) => {
    const result = await removeReaction({ reactionId })

    if (!result.success) {
      throw new Error(result.error)
    }

    // Reaction removal will be applied via Socket.IO event
  }

  const handleArchiveConversation = async (conversationId: string) => {
    const result = await archiveConversation({ conversationId })

    if (result.success) {
      setConversations(prev => prev.filter(c => c.id !== conversationId))
      if (activeConversation?.id === conversationId) {
        setActiveConversation(null)
        router.push("/messages")
      }
      toast({
        title: locale === "ar" ? "تمت الأرشفة" : "Archived",
        description: locale === "ar" ? "تم أرشفة المحادثة بنجاح" : "Conversation archived successfully",
      })
    } else {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: result.error,
      })
    }
  }

  const handleDeleteConversation = async (conversationId: string) => {
    // TODO: Implement delete conversation action
    toast({
      title: locale === "ar" ? "قريباً" : "Coming soon",
      description: locale === "ar" ? "ميزة حذف المحادثة قريباً" : "Delete conversation feature coming soon",
    })
  }

  const handlePinConversation = async (conversationId: string) => {
    // TODO: Implement pin conversation action
    toast({
      title: locale === "ar" ? "قريباً" : "Coming soon",
      description: locale === "ar" ? "ميزة تثبيت المحادثة قريباً" : "Pin conversation feature coming soon",
    })
  }

  const handleMuteConversation = async (conversationId: string) => {
    // TODO: Implement mute conversation action
    toast({
      title: locale === "ar" ? "قريباً" : "Coming soon",
      description: locale === "ar" ? "ميزة كتم المحادثة قريباً" : "Mute conversation feature coming soon",
    })
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Conversations sidebar */}
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
        className="w-80 flex-shrink-0"
      />

      {/* Chat interface */}
      <div className="flex-1">
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
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-muted/20">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                {locale === "ar" ? "اختر محادثة للبدء" : "Select a conversation to start"}
              </p>
              <p className="text-sm text-muted-foreground">
                {locale === "ar"
                  ? "اختر محادثة من القائمة أو ابدأ محادثة جديدة"
                  : "Choose a conversation from the list or start a new one"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
