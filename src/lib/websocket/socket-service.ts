"use client"

/**
 * WebSocket Socket.IO Service - Real-time Event Broadcasting
 *
 * PURPOSE: Provides bidirectional real-time communication for:
 * - Live attendance tracking (mark, update, delete, stats)
 * - Student location updates and geofencing alerts
 * - Device scanning events (RFID, biometric readers)
 * - Push notifications (new, read, deleted, count updates)
 * - Messaging system (send, edit, react, read receipts)
 * - Typing indicators and conversation updates
 *
 * ARCHITECTURE:
 * - Singleton pattern: One connection per browser session
 * - Pub/Sub model: Events emitted from server to subscribed clients
 * - Room-based scoping: Join/leave rooms for targeted delivery
 *   (e.g., class:classId, user:userId, conversation:conversationId)
 * - Fallback transports: WebSocket with HTTP polling fallback
 * - Automatic reconnection: Up to 5 attempts with exponential backoff
 *
 * KEY PATTERNS:
 * - setupEventListeners: Maps socket events to internal listeners
 * - on(): Subscribe to events, returns unsubscribe function
 * - send(): Emit event to server only if connected
 * - joinRoom/leaveRoom: Room-based filtering on server
 *
 * CONSTRAINTS & GOTCHAS:
 * - CRITICAL: Cannot be used in server components (marked "use client")
 * - Manual listener cleanup required if component unmounts
 * - Events are queued during reconnection, not replayed
 * - Room subscription must be done AFTER connection established
 * - Maximum 5 reconnect attempts before failing permanently
 *
 * EXTERNAL SERVICE:
 * - Socket.IO server (configurable via NEXT_PUBLIC_SOCKET_URL env)
 * - Default: http://localhost:3001 (development)
 */
import { io, Socket } from "socket.io-client"

import type {
  AttendanceRecord,
  AttendanceStats,
  AttendanceUpdate,
} from "@/components/school-dashboard/attendance/shared/types"

export interface SocketEvents {
  // Attendance events
  "attendance:marked": (data: AttendanceRecord) => void
  "attendance:updated": (data: AttendanceUpdate) => void
  "attendance:deleted": (data: { attendanceId: string }) => void
  "attendance:stats": (data: AttendanceStats) => void

  // Real-time tracking events
  "location:update": (data: {
    studentId: string
    location: { lat: number; lon: number }
  }) => void
  "geofence:enter": (data: { studentId: string; geofenceId: string }) => void
  "geofence:exit": (data: { studentId: string; geofenceId: string }) => void

  // Device events
  "device:scan": (data: {
    deviceId: string
    method: string
    studentId: string
  }) => void
  "device:connected": (data: { deviceId: string; type: string }) => void
  "device:disconnected": (data: { deviceId: string }) => void

  // Notification events
  "notification:new": (data: {
    id: string
    type: string
    title: string
    body: string
    priority: string
    actorId?: string
  }) => void
  "notification:read": (data: { notificationId: string }) => void
  "notification:deleted": (data: { notificationId: string }) => void
  "notification:count": (data: { unread: number }) => void

  // Messaging events (NEW)
  "message:new": (data: {
    id: string
    conversationId: string
    senderId: string
    content: string
    contentType: string
    createdAt: string
  }) => void
  "message:updated": (data: {
    messageId: string
    content: string
    editedAt: string
  }) => void
  "message:deleted": (data: { messageId: string; deletedAt: string }) => void
  "message:read": (data: {
    messageId: string
    userId: string
    readAt: string
  }) => void
  "message:reaction": (data: {
    messageId: string
    userId: string
    emoji: string
  }) => void
  "conversation:new": (data: {
    id: string
    type: string
    title: string | null
    participantIds: string[]
  }) => void
  "conversation:updated": (data: {
    conversationId: string
    updates: Record<string, unknown>
  }) => void
  "conversation:archived": (data: {
    conversationId: string
    userId: string
  }) => void
  "conversation:participant_added": (data: {
    conversationId: string
    userId: string
    role: string
  }) => void
  "conversation:participant_removed": (data: {
    conversationId: string
    userId: string
  }) => void
  "typing:start": (data: {
    conversationId: string
    userId: string
    username: string
  }) => void
  "typing:stop": (data: { conversationId: string; userId: string }) => void
  "conversation:invite": (data: {
    inviteId: string
    conversationId: string
    inviteeId: string
  }) => void

  // System events
  notification: (data: { type: string; message: string }) => void
  error: (data: { error: string }) => void
}

class SocketService {
  private socket: Socket | null = null
  private url: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private listeners: Map<keyof SocketEvents, Set<Function>> = new Map()
  private isConnecting = false

  constructor() {
    // Use environment variable or default to local development URL
    this.url = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"
  }

  /**
   * Connect to WebSocket server
   */
  connect(schoolId: string, userId: string, role: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve()
        return
      }

      if (this.isConnecting) {
        // Wait for existing connection attempt
        const checkConnection = setInterval(() => {
          if (this.socket?.connected) {
            clearInterval(checkConnection)
            resolve()
          }
        }, 100)
        return
      }

      this.isConnecting = true

      try {
        // WHY: Pass authentication context to server via query parameters
        // Server uses these to validate permissions and route events to correct users
        // Cannot use auth headers (WebSocket handshake limitation)
        this.socket = io(this.url, {
          transports: ["websocket", "polling"],
          query: {
            schoolId,
            userId,
            role,
          },
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
          reconnectionDelayMax: 10000,
        })

        // Connection event handlers
        this.socket.on("connect", () => {
          console.log("✅ WebSocket connected")
          this.reconnectAttempts = 0
          this.isConnecting = false
          this.emit("notification", {
            type: "success",
            message: "Real-time updates connected",
          })
          resolve()
        })

        this.socket.on("disconnect", (reason) => {
          console.log("❌ WebSocket disconnected:", reason)
          this.isConnecting = false
          this.emit("notification", {
            type: "warning",
            message: "Real-time updates disconnected",
          })
        })

        this.socket.on("connect_error", (error) => {
          console.error("WebSocket connection error:", error)
          this.isConnecting = false
          this.reconnectAttempts++

          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.emit("error", {
              error: "Failed to connect to real-time server",
            })
            reject(new Error("Max reconnection attempts reached"))
          }
        })

        // Register all event listeners
        this.setupEventListeners()
      } catch (error) {
        this.isConnecting = false
        reject(error)
      }
    })
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.listeners.clear()
  }

  /**
   * Subscribe to an event
   */
  on<K extends keyof SocketEvents>(
    event: K,
    callback: SocketEvents[K]
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }

    this.listeners.get(event)?.add(callback)

    // If socket is already connected, add listener directly
    if (this.socket) {
      this.socket.on(event, callback as any)
    }

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback)
      if (this.socket) {
        this.socket.off(event, callback as any)
      }
    }
  }

  /**
   * Emit an event locally (for internal use)
   */
  private emit<K extends keyof SocketEvents>(
    event: K,
    data: Parameters<SocketEvents[K]>[0]
  ): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach((callback) => callback(data))
    }
  }

  /**
   * Send an event to the server
   */
  send(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    } else {
      console.warn("Socket not connected. Unable to send event:", event)
    }
  }

  /**
   * Join a room (e.g., class or school)
   */
  joinRoom(room: string): void {
    this.send("join:room", { room })
  }

  /**
   * Leave a room
   */
  leaveRoom(room: string): void {
    this.send("leave:room", { room })
  }

  /**
   * Setup event listeners for incoming events
   */
  private setupEventListeners(): void {
    if (!this.socket) return

    // Attendance events
    this.socket.on("attendance:marked", (data) => {
      this.emit("attendance:marked", data)
    })

    this.socket.on("attendance:updated", (data) => {
      this.emit("attendance:updated", data)
    })

    this.socket.on("attendance:deleted", (data) => {
      this.emit("attendance:deleted", data)
    })

    this.socket.on("attendance:stats", (data) => {
      this.emit("attendance:stats", data)
    })

    // Location tracking events
    this.socket.on("location:update", (data) => {
      this.emit("location:update", data)
    })

    this.socket.on("geofence:enter", (data) => {
      this.emit("geofence:enter", data)
    })

    this.socket.on("geofence:exit", (data) => {
      this.emit("geofence:exit", data)
    })

    // Device events
    this.socket.on("device:scan", (data) => {
      this.emit("device:scan", data)
    })

    this.socket.on("device:connected", (data) => {
      this.emit("device:connected", data)
    })

    this.socket.on("device:disconnected", (data) => {
      this.emit("device:disconnected", data)
    })

    // Notification events
    this.socket.on("notification:new", (data) => {
      this.emit("notification:new", data)
    })

    this.socket.on("notification:read", (data) => {
      this.emit("notification:read", data)
    })

    this.socket.on("notification:deleted", (data) => {
      this.emit("notification:deleted", data)
    })

    this.socket.on("notification:count", (data) => {
      this.emit("notification:count", data)
    })

    // Messaging events (NEW)
    this.socket.on("message:new", (data) => {
      this.emit("message:new", data)
    })

    this.socket.on("message:updated", (data) => {
      this.emit("message:updated", data)
    })

    this.socket.on("message:deleted", (data) => {
      this.emit("message:deleted", data)
    })

    this.socket.on("message:read", (data) => {
      this.emit("message:read", data)
    })

    this.socket.on("message:reaction", (data) => {
      this.emit("message:reaction", data)
    })

    this.socket.on("conversation:new", (data) => {
      this.emit("conversation:new", data)
    })

    this.socket.on("conversation:updated", (data) => {
      this.emit("conversation:updated", data)
    })

    this.socket.on("conversation:archived", (data) => {
      this.emit("conversation:archived", data)
    })

    this.socket.on("conversation:participant_added", (data) => {
      this.emit("conversation:participant_added", data)
    })

    this.socket.on("conversation:participant_removed", (data) => {
      this.emit("conversation:participant_removed", data)
    })

    this.socket.on("typing:start", (data) => {
      this.emit("typing:start", data)
    })

    this.socket.on("typing:stop", (data) => {
      this.emit("typing:stop", data)
    })

    this.socket.on("conversation:invite", (data) => {
      this.emit("conversation:invite", data)
    })

    // Re-attach custom listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket?.on(event, callback as any)
      })
    })
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id
  }

  /**
   * Request attendance stats for a class
   */
  requestStats(classId: string): void {
    this.send("request:stats", { classId })
  }

  /**
   * Request live attendance updates for a class
   */
  subscribeToClass(classId: string): void {
    this.joinRoom(`class:${classId}`)
    this.send("subscribe:attendance", { classId })
  }

  /**
   * Unsubscribe from class updates
   */
  unsubscribeFromClass(classId: string): void {
    this.leaveRoom(`class:${classId}`)
    this.send("unsubscribe:attendance", { classId })
  }

  /**
   * Send location update
   */
  sendLocationUpdate(location: {
    lat: number
    lon: number
    accuracy?: number
  }): void {
    this.send("location:update", location)
  }

  /**
   * Send device scan event
   */
  sendDeviceScan(data: {
    method: string
    identifier: string
    deviceId: string
  }): void {
    this.send("device:scan", data)
  }

  /**
   * Subscribe to user notifications
   */
  subscribeToNotifications(userId: string): void {
    this.joinRoom(`user:${userId}`)
    this.send("subscribe:notifications", { userId })
  }

  /**
   * Unsubscribe from user notifications
   */
  unsubscribeFromNotifications(userId: string): void {
    this.leaveRoom(`user:${userId}`)
    this.send("unsubscribe:notifications", { userId })
  }

  /**
   * Mark notification as read (send to server)
   */
  markNotificationRead(notificationId: string): void {
    this.send("notification:mark_read", { notificationId })
  }

  /**
   * Mark all notifications as read (send to server)
   */
  markAllNotificationsRead(userId: string): void {
    this.send("notification:mark_all_read", { userId })
  }

  /**
   * Subscribe to conversation messages
   */
  subscribeToConversation(conversationId: string): void {
    this.joinRoom(`conversation:${conversationId}`)
    this.send("subscribe:conversation", { conversationId })
  }

  /**
   * Unsubscribe from conversation messages
   */
  unsubscribeFromConversation(conversationId: string): void {
    this.leaveRoom(`conversation:${conversationId}`)
    this.send("unsubscribe:conversation", { conversationId })
  }

  /**
   * Send typing indicator start
   */
  sendTypingStart(conversationId: string): void {
    this.send("typing:start", { conversationId })
  }

  /**
   * Send typing indicator stop
   */
  sendTypingStop(conversationId: string): void {
    this.send("typing:stop", { conversationId })
  }

  /**
   * Send message via Socket.IO
   */
  sendMessage(data: {
    conversationId: string
    content: string
    contentType?: string
    replyToId?: string
  }): void {
    this.send("message:send", data)
  }

  /**
   * Mark message as read via Socket.IO
   */
  markMessageRead(messageId: string): void {
    this.send("message:mark_read", { messageId })
  }

  /**
   * Add reaction to message via Socket.IO
   */
  addMessageReaction(messageId: string, emoji: string): void {
    this.send("message:add_reaction", { messageId, emoji })
  }

  /**
   * Remove reaction from message via Socket.IO
   */
  removeMessageReaction(reactionId: string): void {
    this.send("message:remove_reaction", { reactionId })
  }

  /**
   * Subscribe to user's conversations
   */
  subscribeToConversations(userId: string): void {
    this.joinRoom(`user_conversations:${userId}`)
    this.send("subscribe:conversations", { userId })
  }

  /**
   * Unsubscribe from user's conversations
   */
  unsubscribeFromConversations(userId: string): void {
    this.leaveRoom(`user_conversations:${userId}`)
    this.send("unsubscribe:conversations", { userId })
  }
}

// Create singleton instance
const socketService = new SocketService()

export default socketService
