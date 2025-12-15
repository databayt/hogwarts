/**
 * Custom Next.js Server with WebSocket Support
 * Integrates PostgreSQL LISTEN/NOTIFY for real-time geofence events
 * Part of the Hogwarts School Management System
 */

const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")
const { WebSocketServer } = require("ws")
const { Pool } = require("pg")

const dev = process.env.NODE_ENV !== "production"
const hostname = "localhost"
const port = parseInt(process.env.PORT || "3000", 10)

// Initialize Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// PostgreSQL connection pool for LISTEN/NOTIFY
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Track active subscriptions: { schoolId: Set<WebSocket> }
const subscriptions = new Map()

// PostgreSQL LISTEN clients per school
const listenClients = new Map()

/**
 * Start listening to PostgreSQL notifications for a specific school
 */
async function startListening(schoolId) {
  if (listenClients.has(schoolId)) {
    return // Already listening
  }

  try {
    const client = await pool.connect()

    // Listen to both location and event channels for this school
    await client.query(`LISTEN geo_location_${schoolId}`)
    await client.query(`LISTEN geo_event_${schoolId}`)

    // Handle notifications
    client.on("notification", (msg) => {
      const { channel, payload } = msg

      // Broadcast to all WebSocket clients subscribed to this school
      const subscribers = subscriptions.get(schoolId)
      if (subscribers && subscribers.size > 0) {
        const data = JSON.parse(payload)
        const message = JSON.stringify({
          channel,
          schoolId,
          data,
          timestamp: new Date().toISOString(),
        })

        subscribers.forEach((ws) => {
          if (ws.readyState === 1) {
            // 1 = OPEN
            ws.send(message)
          }
        })
      }
    })

    // Handle client errors
    client.on("error", (err) => {
      console.error(`PostgreSQL client error for school ${schoolId}:`, err)
      listenClients.delete(schoolId)
    })

    listenClients.set(schoolId, client)
    console.log(
      `✓ Started listening to geo notifications for school: ${schoolId}`
    )
  } catch (error) {
    console.error(`Error starting LISTEN for school ${schoolId}:`, error)
  }
}

/**
 * Stop listening to PostgreSQL notifications for a specific school
 */
async function stopListening(schoolId) {
  const client = listenClients.get(schoolId)
  if (!client) return

  try {
    await client.query(`UNLISTEN geo_location_${schoolId}`)
    await client.query(`UNLISTEN geo_event_${schoolId}`)
    client.release()
    listenClients.delete(schoolId)
    console.log(
      `✓ Stopped listening to geo notifications for school: ${schoolId}`
    )
  } catch (error) {
    console.error(`Error stopping LISTEN for school ${schoolId}:`, error)
  }
}

/**
 * Subscribe a WebSocket client to a school's notifications
 */
function subscribe(ws, schoolId) {
  if (!subscriptions.has(schoolId)) {
    subscriptions.set(schoolId, new Set())
  }
  subscriptions.get(schoolId).add(ws)

  // Start PostgreSQL LISTEN if not already started
  startListening(schoolId)

  console.log(
    `✓ WebSocket subscribed to school ${schoolId} (${subscriptions.get(schoolId).size} total subscribers)`
  )
}

/**
 * Unsubscribe a WebSocket client from a school's notifications
 */
function unsubscribe(ws, schoolId) {
  const subscribers = subscriptions.get(schoolId)
  if (subscribers) {
    subscribers.delete(ws)

    // If no more subscribers, stop listening
    if (subscribers.size === 0) {
      subscriptions.delete(schoolId)
      stopListening(schoolId)
    }

    console.log(
      `✓ WebSocket unsubscribed from school ${schoolId} (${subscribers.size} remaining subscribers)`
    )
  }
}

/**
 * Initialize the server
 */
app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  // Initialize WebSocket server
  const wss = new WebSocketServer({ server, path: "/api/geo/ws" })

  wss.on("connection", (ws, req) => {
    console.log("✓ New WebSocket connection established")

    let currentSchoolId = null

    // Handle incoming messages
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString())

        if (data.type === "subscribe" && data.schoolId) {
          // Unsubscribe from previous school if any
          if (currentSchoolId) {
            unsubscribe(ws, currentSchoolId)
          }

          // Subscribe to new school
          currentSchoolId = data.schoolId
          subscribe(ws, currentSchoolId)

          // Send confirmation
          ws.send(
            JSON.stringify({
              type: "subscribed",
              schoolId: currentSchoolId,
              timestamp: new Date().toISOString(),
            })
          )
        } else if (data.type === "unsubscribe") {
          if (currentSchoolId) {
            unsubscribe(ws, currentSchoolId)
            currentSchoolId = null

            ws.send(
              JSON.stringify({
                type: "unsubscribed",
                timestamp: new Date().toISOString(),
              })
            )
          }
        } else if (data.type === "ping") {
          // Heartbeat/keep-alive
          ws.send(
            JSON.stringify({
              type: "pong",
              timestamp: new Date().toISOString(),
            })
          )
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error)
        ws.send(
          JSON.stringify({
            type: "error",
            error: "Invalid message format",
          })
        )
      }
    })

    // Handle WebSocket errors
    ws.on("error", (error) => {
      console.error("WebSocket error:", error)
    })

    // Handle WebSocket close
    ws.on("close", () => {
      if (currentSchoolId) {
        unsubscribe(ws, currentSchoolId)
      }
      console.log("✓ WebSocket connection closed")
    })

    // Send welcome message
    ws.send(
      JSON.stringify({
        type: "welcome",
        message: "Connected to Hogwarts Geofence WebSocket Server",
        timestamp: new Date().toISOString(),
      })
    )
  })

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(
      `> WebSocket server ready at ws://${hostname}:${port}/api/geo/ws`
    )
    console.log(`> Environment: ${dev ? "development" : "production"}`)
  })

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    console.log("SIGTERM signal received: closing HTTP server")

    // Close all PostgreSQL LISTEN clients
    for (const [schoolId, client] of listenClients.entries()) {
      try {
        await client.query(`UNLISTEN geo_location_${schoolId}`)
        await client.query(`UNLISTEN geo_event_${schoolId}`)
        client.release()
      } catch (error) {
        console.error(`Error during shutdown for school ${schoolId}:`, error)
      }
    }

    // Close pool
    await pool.end()

    // Close WebSocket server
    wss.close(() => {
      console.log("WebSocket server closed")
    })

    // Close HTTP server
    server.close(() => {
      console.log("HTTP server closed")
      process.exit(0)
    })
  })
})
