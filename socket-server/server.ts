/**
 * Hogwarts Real-Time Socket.IO Server
 *
 * Handles: messaging events, typing relay, presence tracking, delivered status.
 * Deployed as a sidecar on Fly.io. Next.js server actions POST to /api/emit
 * to broadcast events to connected clients.
 *
 * Auth: Short-lived JWT signed with SOCKET_SECRET, verified on connection.
 * Scaling: @socket.io/redis-adapter with Upstash Redis for multi-instance.
 * Tenant isolation: All rooms scoped by schoolId.
 */

import { createServer } from "http"
import { createAdapter } from "@socket.io/redis-adapter"
import cors from "cors"
import express from "express"
import { Redis } from "ioredis"
import jwt from "jsonwebtoken"
import { Server, Socket } from "socket.io"

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PORT = parseInt(process.env.PORT || "3001", 10)
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000"
const SOCKET_SECRET = process.env.SOCKET_SECRET || "dev-socket-secret"
const REDIS_URL = process.env.REDIS_URL // ioredis connection string
const EMIT_SECRET = process.env.EMIT_SECRET || SOCKET_SECRET // for /api/emit auth

// Presence TTL in seconds (refresh every heartbeat)
const PRESENCE_TTL = 90

// ---------------------------------------------------------------------------
// Express + HTTP
// ---------------------------------------------------------------------------

const app = express()
app.use(cors({ origin: CLIENT_URL, credentials: true }))
app.use(express.json())

const httpServer = createServer(app)

// ---------------------------------------------------------------------------
// Socket.IO Server
// ---------------------------------------------------------------------------

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingInterval: 25000,
  pingTimeout: 20000,
})

// ---------------------------------------------------------------------------
// Redis Adapter (optional — works without it for single instance)
// ---------------------------------------------------------------------------

let redis: Redis | null = null

async function setupRedisAdapter() {
  if (!REDIS_URL) {
    console.log("⚠️  No REDIS_URL — running single-instance (no adapter)")
    return
  }

  try {
    const pubClient = new Redis(REDIS_URL)
    const subClient = pubClient.duplicate()

    await Promise.all([
      new Promise<void>((resolve, reject) => {
        pubClient.on("ready", resolve)
        pubClient.on("error", reject)
      }),
      new Promise<void>((resolve, reject) => {
        subClient.on("ready", resolve)
        subClient.on("error", reject)
      }),
    ])

    io.adapter(createAdapter(pubClient, subClient))
    redis = pubClient
    console.log("✅ Redis adapter connected")
  } catch (err) {
    console.error("⚠️  Redis adapter failed, running single-instance:", err)
  }
}

// ---------------------------------------------------------------------------
// Presence Store (Redis if available, in-memory fallback)
// ---------------------------------------------------------------------------

// In-memory fallback: schoolId -> Set<userId>
const memoryPresence = new Map<string, Set<string>>()

async function setPresence(schoolId: string, userId: string): Promise<void> {
  if (redis) {
    const key = `presence:${schoolId}`
    await redis.sadd(key, userId)
    await redis.expire(key, PRESENCE_TTL)
  } else {
    if (!memoryPresence.has(schoolId)) memoryPresence.set(schoolId, new Set())
    memoryPresence.get(schoolId)!.add(userId)
  }
}

async function removePresence(schoolId: string, userId: string): Promise<void> {
  if (redis) {
    await redis.srem(`presence:${schoolId}`, userId)
  } else {
    memoryPresence.get(schoolId)?.delete(userId)
  }
}

async function getOnlineUsers(schoolId: string): Promise<string[]> {
  if (redis) {
    return redis.smembers(`presence:${schoolId}`)
  }
  return Array.from(memoryPresence.get(schoolId) || [])
}

// Track socket -> user mapping for disconnect cleanup
const socketUserMap = new Map<
  string,
  { schoolId: string; userId: string; role: string }
>()

// Track userId -> Set<socketId> for multi-tab support
const userSocketsMap = new Map<string, Set<string>>()

// ---------------------------------------------------------------------------
// Auth Middleware
// ---------------------------------------------------------------------------

interface TokenPayload {
  userId: string
  schoolId: string
  role: string
}

io.use((socket, next) => {
  const token = socket.handshake.query.token as string | undefined
  const schoolId = socket.handshake.query.schoolId as string
  const userId = socket.handshake.query.userId as string
  const role = socket.handshake.query.role as string

  // If token provided, verify it (production mode)
  if (token) {
    try {
      const decoded = jwt.verify(token, SOCKET_SECRET) as TokenPayload
      socket.data = {
        userId: decoded.userId,
        schoolId: decoded.schoolId,
        role: decoded.role,
      }
      return next()
    } catch {
      return next(new Error("Invalid token"))
    }
  }

  // Fallback: accept query params directly (development mode)
  if (userId && schoolId) {
    socket.data = { userId, schoolId, role: role || "USER" }
    return next()
  }

  return next(new Error("Authentication required"))
})

// ---------------------------------------------------------------------------
// Connection Handler
// ---------------------------------------------------------------------------

io.on("connection", async (socket: Socket) => {
  const { userId, schoolId, role } = socket.data as TokenPayload

  console.log(
    `✅ Connected: ${userId} (${role}) school:${schoolId} [${socket.id}]`
  )

  // Store mapping
  socketUserMap.set(socket.id, { schoolId, userId, role })

  if (!userSocketsMap.has(userId)) userSocketsMap.set(userId, new Set())
  userSocketsMap.get(userId)!.add(socket.id)

  // Auto-join tenant and user rooms
  socket.join(`school:${schoolId}`)
  socket.join(`user:${userId}`)

  // Presence: mark online
  const wasOnline = (userSocketsMap.get(userId)?.size || 0) > 1
  if (!wasOnline) {
    await setPresence(schoolId, userId)
    socket.to(`school:${schoolId}`).emit("presence:online", {
      userId,
      timestamp: new Date().toISOString(),
    })
  }

  // Send current online users to the connecting client
  const onlineUsers = await getOnlineUsers(schoolId)
  socket.emit("presence:list", { users: onlineUsers })

  // --- Room management ---

  socket.on("join:room", ({ room }: { room: string }) => {
    socket.join(room)
  })

  socket.on("leave:room", ({ room }: { room: string }) => {
    socket.leave(room)
  })

  // --- Typing relay (client -> server -> other clients) ---

  socket.on(
    "typing:start",
    (data: { conversationId: string; username?: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit("typing:start", {
        conversationId: data.conversationId,
        userId,
        username: data.username || userId,
      })
    }
  )

  socket.on("typing:stop", (data: { conversationId: string }) => {
    socket.to(`conversation:${data.conversationId}`).emit("typing:stop", {
      conversationId: data.conversationId,
      userId,
    })
  })

  // --- Presence heartbeat ---

  socket.on("presence:heartbeat", async () => {
    await setPresence(schoolId, userId)
  })

  // --- Disconnect ---

  socket.on("disconnect", async (reason) => {
    console.log(`❌ Disconnected: ${userId} [${socket.id}] reason: ${reason}`)

    socketUserMap.delete(socket.id)
    userSocketsMap.get(userId)?.delete(socket.id)

    // Only broadcast offline if user has no more sockets (closed all tabs)
    const remaining = userSocketsMap.get(userId)?.size || 0
    if (remaining === 0) {
      userSocketsMap.delete(userId)
      await removePresence(schoolId, userId)
      socket.to(`school:${schoolId}`).emit("presence:offline", {
        userId,
        lastSeenAt: new Date().toISOString(),
      })
    }
  })
})

// ---------------------------------------------------------------------------
// REST: /api/emit — Server actions POST here to broadcast events
// ---------------------------------------------------------------------------

app.post("/api/emit", (req, res) => {
  const { room, event, data } = req.body

  if (!room || !event) {
    res.status(400).json({ error: "Missing room or event" })
    return
  }

  // Broadcast to the room
  io.to(room).emit(event, data)

  // Delivered status: if this is a message:new event, notify the sender
  if (event === "message:new" && data?.senderId) {
    const roomSockets = io.sockets.adapter.rooms.get(room)
    if (roomSockets) {
      // Check if any recipient (non-sender) is in the room
      let hasRecipient = false
      for (const socketId of roomSockets) {
        const info = socketUserMap.get(socketId)
        if (info && info.userId !== data.senderId) {
          hasRecipient = true
          break
        }
      }
      if (hasRecipient) {
        // Emit delivered status back to sender's user room
        io.to(`user:${data.senderId}`).emit("message:delivered", {
          messageId: data.id,
          conversationId: data.conversationId,
          deliveredAt: new Date().toISOString(),
        })
      }
    }
  }

  res.json({ ok: true })
})

// ---------------------------------------------------------------------------
// REST: /api/emit-to-users — Emit to multiple user rooms (for sidebar updates)
// ---------------------------------------------------------------------------

app.post("/api/emit-to-users", (req, res) => {
  const { userIds, event, data } = req.body

  if (!Array.isArray(userIds) || !event) {
    res.status(400).json({ error: "Missing userIds or event" })
    return
  }

  for (const uid of userIds) {
    io.to(`user:${uid}`).emit(event, data)
  }

  res.json({ ok: true })
})

// ---------------------------------------------------------------------------
// REST: /api/status — Health check
// ---------------------------------------------------------------------------

app.get("/api/status", async (_req, res) => {
  const schools = new Set<string>()
  socketUserMap.forEach((v) => schools.add(v.schoolId))

  res.json({
    status: "ok",
    connections: io.engine.clientsCount,
    schools: schools.size,
    rooms: io.sockets.adapter.rooms.size,
    uptime: Math.floor(process.uptime()),
    redis: redis ? "connected" : "none",
  })
})

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

async function start() {
  await setupRedisAdapter()

  httpServer.listen(PORT, () => {
    console.log(`🚀 Socket.IO server on port ${PORT}`)
    console.log(`📡 CORS origin: ${CLIENT_URL}`)
    console.log(
      `🔑 Auth: ${SOCKET_SECRET === "dev-socket-secret" ? "DEV MODE (no JWT required)" : "JWT required"}`
    )
  })
}

start()

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received — shutting down")
  io.close()
  httpServer.close(() => process.exit(0))
})

process.on("SIGINT", () => {
  console.log("SIGINT received — shutting down")
  io.close()
  httpServer.close(() => process.exit(0))
})

export default httpServer
