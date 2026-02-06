"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Menu, X } from "lucide-react"

import { cn } from "@/lib/utils"
import socketService from "@/lib/websocket/socket-service"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

import {
  addReaction,
  archiveConversation,
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
import { ConversationList } from "./conversation-list"
import { NoActiveConversation } from "./empty-state"
import { NewConversationDialog } from "./new-conversation-dialog"
import type { ConversationDTO, MessageDTO } from "./types"

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
  const [conversations, setConversations] =
    useState<ConversationDTO[]>(initialConversations)
  const [activeConversation, setActiveConversation] =
    useState<ConversationDTO | null>(initialActiveConversation)
  const [messages, setMessages] = useState<MessageDTO[]>(initialMessages)
  const [isConnected, setIsConnected] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showNewConversationDialog, setShowNewConversationDialog] =
    useState(false)

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

    const unsubscribeConversationNew = socketService.on(
      "conversation:new",
      (data) => {
        // Add new conversation to list
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
    // Close sidebar on mobile/tablet when conversation is selected
    setIsSidebarOpen(false)
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
      setConversations((prev) => prev.filter((c) => c.id !== conversationId))
      if (activeConversation?.id === conversationId) {
        setActiveConversation(null)
        router.push("/messages")
      }
      toast({
        title: locale === "ar" ? "تمت الأرشفة" : "Archived",
        description:
          locale === "ar"
            ? "تم أرشفة المحادثة بنجاح"
            : "Conversation archived successfully",
      })
    } else {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
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
        title: locale === "ar" ? "تم الحذف" : "Deleted",
        description:
          locale === "ar"
            ? "تم حذف المحادثة بنجاح"
            : "Conversation deleted successfully",
      })
    } else {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
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
      // Update local state
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
        title:
          locale === "ar"
            ? isPinned
              ? "تم إلغاء التثبيت"
              : "تم التثبيت"
            : isPinned
              ? "Unpinned"
              : "Pinned",
        description:
          locale === "ar"
            ? isPinned
              ? "تم إلغاء تثبيت المحادثة"
              : "تم تثبيت المحادثة"
            : isPinned
              ? "Conversation unpinned"
              : "Conversation pinned",
      })
    } else {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
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
      // Update local state
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
        title:
          locale === "ar"
            ? isMuted
              ? "تم إلغاء الكتم"
              : "تم الكتم"
            : isMuted
              ? "Unmuted"
              : "Muted",
        description:
          locale === "ar"
            ? isMuted
              ? "تم إلغاء كتم المحادثة"
              : "تم كتم المحادثة"
            : isMuted
              ? "Conversation unmuted"
              : "Conversation muted",
      })
    } else {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: result.error,
      })
    }
  }

  return (
    <div className="bg-background relative flex h-[calc(100vh-4rem)]">
      {/* Mobile/Tablet: Overlay backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Conversations sidebar */}
      {/* Mobile (<640px): Hidden unless sidebar open OR no active conversation */}
      {/* Tablet (640-767px): Overlay when open */}
      {/* Desktop (≥768px): Always visible, 430px fixed width */}
      <div
        className={cn(
          // Base styles
          "bg-background border-border flex-shrink-0 border-e",
          // Mobile: full width overlay OR show when no conversation
          "fixed z-50 md:relative md:z-0",
          "h-full w-full sm:w-96 md:w-[430px]",
          // Mobile: show sidebar if open OR if no active conversation
          activeConversation
            ? isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
            : "translate-x-0",
          // Tablet: slide in from left when open
          "transition-transform duration-300 ease-in-out"
        )}
      >
        {/* Close button for mobile/tablet overlay */}
        <div className="absolute top-4 right-4 z-10 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

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
      </div>

      {/* Chat interface */}
      {/* Mobile: Hidden when no conversation OR sidebar is open */}
      {/* Desktop: Always visible, takes remaining space */}
      <div
        className={cn(
          "flex flex-1 flex-col",
          // Mobile: hide when no active conversation
          !activeConversation && "hidden md:flex"
        )}
      >
        {/* Mobile/Tablet: Menu button to toggle sidebar (only show when conversation is active) */}
        {activeConversation && (
          <div className="border-border bg-background flex items-center gap-3 border-b px-4 py-3 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="h-8 w-8 flex-shrink-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h2 className="text-foreground truncate font-semibold">
                {activeConversation.type === "direct"
                  ? activeConversation.participants?.find(
                      (p) => p.userId !== currentUserId
                    )?.user?.username || (locale === "ar" ? "مستخدم" : "User")
                  : activeConversation.title ||
                    (locale === "ar" ? "محادثة" : "Conversation")}
              </h2>
            </div>
          </div>
        )}

        {/* Chat content */}
        <div className="flex-1 overflow-hidden">
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
            <NoActiveConversation
              locale={locale}
              onNewConversation={handleNewConversation}
            />
          )}
        </div>
      </div>

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
