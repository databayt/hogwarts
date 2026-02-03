"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"

import socketService, { SocketEvents } from "@/lib/websocket/socket-service"
import { toast } from "@/components/ui/use-toast"

/**
 * Real-time messaging hook
 *
 * Provides WebSocket-powered real-time updates for:
 * - New messages in conversations
 * - Message edits and deletions
 * - Read receipts
 * - Reactions
 * - Typing indicators
 * - Conversation updates
 *
 * Usage:
 * ```tsx
 * const {
 *   isConnected,
 *   typingUsers,
 *   sendTypingIndicator,
 *   onNewMessage,
 *   subscribeToConversation,
 * } = useRealtimeMessages({
 *   conversationId: "conv-123",
 *   onNewMessage: (message) => addMessageToList(message),
 * })
 * ```
 */

interface TypingUser {
  userId: string
  username: string
  startedAt: number
}

interface UseRealtimeMessagesOptions {
  /** Current conversation ID to subscribe to */
  conversationId?: string
  /** Callback when new message received */
  onNewMessage?: (
    message: SocketEvents["message:new"] extends (data: infer D) => void
      ? D
      : never
  ) => void
  /** Callback when message is updated */
  onMessageUpdated?: (
    data: SocketEvents["message:updated"] extends (data: infer D) => void
      ? D
      : never
  ) => void
  /** Callback when message is deleted */
  onMessageDeleted?: (
    data: SocketEvents["message:deleted"] extends (data: infer D) => void
      ? D
      : never
  ) => void
  /** Callback when message is read */
  onMessageRead?: (
    data: SocketEvents["message:read"] extends (data: infer D) => void
      ? D
      : never
  ) => void
  /** Callback when reaction added */
  onReaction?: (
    data: SocketEvents["message:reaction"] extends (data: infer D) => void
      ? D
      : never
  ) => void
  /** Callback when conversation is updated */
  onConversationUpdated?: (
    data: SocketEvents["conversation:updated"] extends (data: infer D) => void
      ? D
      : never
  ) => void
  /** Callback when participant joins */
  onParticipantAdded?: (
    data: SocketEvents["conversation:participant_added"] extends (
      data: infer D
    ) => void
      ? D
      : never
  ) => void
  /** Callback when participant leaves */
  onParticipantRemoved?: (
    data: SocketEvents["conversation:participant_removed"] extends (
      data: infer D
    ) => void
      ? D
      : never
  ) => void
  /** Auto-connect on mount */
  autoConnect?: boolean
  /** Show toast notifications for events */
  showNotifications?: boolean
}

interface UseRealtimeMessagesReturn {
  /** Whether socket is connected */
  isConnected: boolean
  /** Users currently typing in the conversation */
  typingUsers: TypingUser[]
  /** Connect to socket server */
  connect: () => Promise<void>
  /** Disconnect from socket server */
  disconnect: () => void
  /** Subscribe to a conversation */
  subscribeToConversation: (conversationId: string) => void
  /** Unsubscribe from a conversation */
  unsubscribeFromConversation: (conversationId: string) => void
  /** Send typing indicator (call on input change) */
  sendTypingIndicator: () => void
  /** Stop typing indicator (call on blur or send) */
  stopTypingIndicator: () => void
  /** Subscribe to all user's conversations */
  subscribeToAllConversations: () => void
  /** Unsubscribe from all conversations */
  unsubscribeFromAllConversations: () => void
}

// Typing indicator timeout (stop showing after 3 seconds of no activity)
const TYPING_TIMEOUT = 3000
// Debounce typing indicator to prevent flooding
const TYPING_DEBOUNCE = 500

export function useRealtimeMessages(
  options: UseRealtimeMessagesOptions = {}
): UseRealtimeMessagesReturn {
  const { data: session } = useSession()
  const [isConnected, setIsConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])

  // Refs for cleanup and debouncing
  const unsubscribersRef = useRef<Array<() => void>>([])
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTypingSentRef = useRef<number>(0)
  const currentConversationRef = useRef<string | null>(null)

  const {
    conversationId,
    onNewMessage,
    onMessageUpdated,
    onMessageDeleted,
    onMessageRead,
    onReaction,
    onConversationUpdated,
    onParticipantAdded,
    onParticipantRemoved,
    autoConnect = true,
    showNotifications = false,
  } = options

  // Connect to socket server
  const connect = useCallback(async () => {
    if (!session?.user) {
      console.warn("[useRealtimeMessages] No session available")
      return
    }

    try {
      await socketService.connect(
        session.user.schoolId || "",
        session.user.id || "",
        session.user.role
      )
      setIsConnected(true)
    } catch (error) {
      console.error("[useRealtimeMessages] Connection failed:", error)
      setIsConnected(false)
    }
  }, [session])

  // Disconnect from socket server
  const disconnect = useCallback(() => {
    // Clear all subscriptions
    unsubscribersRef.current.forEach((unsub) => unsub())
    unsubscribersRef.current = []

    socketService.disconnect()
    setIsConnected(false)
  }, [])

  // Subscribe to a specific conversation
  const subscribeToConversation = useCallback((convId: string) => {
    if (!convId) return

    // Unsubscribe from previous conversation
    if (
      currentConversationRef.current &&
      currentConversationRef.current !== convId
    ) {
      socketService.unsubscribeFromConversation(currentConversationRef.current)
    }

    currentConversationRef.current = convId
    socketService.subscribeToConversation(convId)
  }, [])

  // Unsubscribe from a specific conversation
  const unsubscribeFromConversation = useCallback((convId: string) => {
    socketService.unsubscribeFromConversation(convId)
    if (currentConversationRef.current === convId) {
      currentConversationRef.current = null
    }
    setTypingUsers([])
  }, [])

  // Subscribe to all user's conversations
  const subscribeToAllConversations = useCallback(() => {
    if (!session?.user?.id) return
    socketService.subscribeToConversations(session.user.id)
  }, [session?.user?.id])

  // Unsubscribe from all conversations
  const unsubscribeFromAllConversations = useCallback(() => {
    if (!session?.user?.id) return
    socketService.unsubscribeFromConversations(session.user.id)
  }, [session?.user?.id])

  // Send typing indicator with debounce
  const sendTypingIndicator = useCallback(() => {
    const now = Date.now()
    const convId = currentConversationRef.current

    if (!convId || !isConnected) return

    // Debounce: Only send if enough time has passed
    if (now - lastTypingSentRef.current < TYPING_DEBOUNCE) {
      return
    }

    lastTypingSentRef.current = now
    socketService.sendTypingStart(convId)

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (currentConversationRef.current) {
        socketService.sendTypingStop(currentConversationRef.current)
      }
    }, TYPING_TIMEOUT)
  }, [isConnected])

  // Explicitly stop typing indicator
  const stopTypingIndicator = useCallback(() => {
    const convId = currentConversationRef.current

    if (!convId || !isConnected) return

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    socketService.sendTypingStop(convId)
  }, [isConnected])

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && session?.user) {
      connect()
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      // Don't disconnect on unmount - let other components share the connection
    }
  }, [autoConnect, session, connect])

  // Subscribe to conversation when conversationId changes
  useEffect(() => {
    if (isConnected && conversationId) {
      subscribeToConversation(conversationId)
    }

    return () => {
      if (conversationId) {
        unsubscribeFromConversation(conversationId)
      }
    }
  }, [
    isConnected,
    conversationId,
    subscribeToConversation,
    unsubscribeFromConversation,
  ])

  // Set up event listeners
  useEffect(() => {
    if (!isConnected) return

    const subscriptions: Array<() => void> = []

    // New message event
    subscriptions.push(
      socketService.on("message:new", (data) => {
        // Only process if for current conversation
        if (data.conversationId === currentConversationRef.current) {
          onNewMessage?.(data)

          if (showNotifications && data.senderId !== session?.user?.id) {
            toast({
              title: "New message",
              description:
                data.content.slice(0, 50) +
                (data.content.length > 50 ? "..." : ""),
            })
          }
        }
      })
    )

    // Message updated event
    subscriptions.push(
      socketService.on("message:updated", (data) => {
        onMessageUpdated?.(data)
      })
    )

    // Message deleted event
    subscriptions.push(
      socketService.on("message:deleted", (data) => {
        onMessageDeleted?.(data)
      })
    )

    // Message read event
    subscriptions.push(
      socketService.on("message:read", (data) => {
        onMessageRead?.(data)
      })
    )

    // Reaction event
    subscriptions.push(
      socketService.on("message:reaction", (data) => {
        onReaction?.(data)
      })
    )

    // Conversation updated event
    subscriptions.push(
      socketService.on("conversation:updated", (data) => {
        if (data.conversationId === currentConversationRef.current) {
          onConversationUpdated?.(data)
        }
      })
    )

    // Participant added event
    subscriptions.push(
      socketService.on("conversation:participant_added", (data) => {
        if (data.conversationId === currentConversationRef.current) {
          onParticipantAdded?.(data)

          if (showNotifications) {
            toast({
              title: "Participant added",
              description: "A new member joined the conversation",
            })
          }
        }
      })
    )

    // Participant removed event
    subscriptions.push(
      socketService.on("conversation:participant_removed", (data) => {
        if (data.conversationId === currentConversationRef.current) {
          onParticipantRemoved?.(data)

          // Remove from typing users if they were typing
          setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId))
        }
      })
    )

    // Typing start event
    subscriptions.push(
      socketService.on("typing:start", (data) => {
        if (
          data.conversationId === currentConversationRef.current &&
          data.userId !== session?.user?.id
        ) {
          setTypingUsers((prev) => {
            const existing = prev.find((u) => u.userId === data.userId)
            if (existing) {
              return prev.map((u) =>
                u.userId === data.userId ? { ...u, startedAt: Date.now() } : u
              )
            }
            return [
              ...prev,
              {
                userId: data.userId,
                username: data.username,
                startedAt: Date.now(),
              },
            ]
          })
        }
      })
    )

    // Typing stop event
    subscriptions.push(
      socketService.on("typing:stop", (data) => {
        if (data.conversationId === currentConversationRef.current) {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId))
        }
      })
    )

    // Store for cleanup
    unsubscribersRef.current = subscriptions

    return () => {
      subscriptions.forEach((unsub) => unsub())
    }
  }, [
    isConnected,
    session?.user?.id,
    onNewMessage,
    onMessageUpdated,
    onMessageDeleted,
    onMessageRead,
    onReaction,
    onConversationUpdated,
    onParticipantAdded,
    onParticipantRemoved,
    showNotifications,
  ])

  // Clean up stale typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setTypingUsers((prev) =>
        prev.filter((user) => now - user.startedAt < TYPING_TIMEOUT * 2)
      )
    }, TYPING_TIMEOUT)

    return () => clearInterval(interval)
  }, [])

  return {
    isConnected,
    typingUsers,
    connect,
    disconnect,
    subscribeToConversation,
    unsubscribeFromConversation,
    sendTypingIndicator,
    stopTypingIndicator,
    subscribeToAllConversations,
    unsubscribeFromAllConversations,
  }
}

/**
 * Simplified hook for conversation list updates
 * Use this in conversation sidebar to get notified of new messages
 */
export function useConversationListUpdates(options: {
  onNewMessage?: (data: { conversationId: string; content: string }) => void
  onConversationCreated?: (data: { id: string }) => void
}) {
  const { data: session } = useSession()
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!session?.user) return

    const connect = async () => {
      try {
        await socketService.connect(
          session.user.schoolId || "",
          session.user.id || "",
          session.user.role
        )
        setIsConnected(true)

        // Subscribe to all user's conversations
        socketService.subscribeToConversations(session.user.id)
      } catch (error) {
        console.error("[useConversationListUpdates] Connection failed:", error)
      }
    }

    connect()

    const unsubscribers: Array<() => void> = []

    // Listen for new messages
    unsubscribers.push(
      socketService.on("message:new", (data) => {
        options.onNewMessage?.({
          conversationId: data.conversationId,
          content: data.content,
        })
      })
    )

    // Listen for new conversations
    unsubscribers.push(
      socketService.on("conversation:new", (data) => {
        options.onConversationCreated?.({ id: data.id })
      })
    )

    return () => {
      unsubscribers.forEach((unsub) => unsub())
      if (session?.user?.id) {
        socketService.unsubscribeFromConversations(session.user.id)
      }
    }
  }, [session, options.onNewMessage, options.onConversationCreated])

  return { isConnected }
}

export default useRealtimeMessages
