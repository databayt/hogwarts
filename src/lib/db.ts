import { PrismaClient } from "@prisma/client"

/**
 * Prisma Client Singleton - Database Connection Management
 *
 * WHY GLOBAL SINGLETON:
 * In development, Next.js Hot Module Replacement (HMR) causes modules to be
 * re-imported on every file change. Without this pattern, each HMR would create
 * a new PrismaClient, exhausting the database connection pool within minutes.
 *
 * HOW IT WORKS:
 * 1. Check if PrismaClient already exists on globalThis
 * 2. If not, create new instance
 * 3. In development, attach to global so it survives HMR
 * 4. In production, skip global attachment (no HMR)
 *
 * GOTCHA: This pattern doesn't work in Edge Runtime (no globalThis).
 * Edge functions must use different connection strategies.
 *
 * See: https://pris.ly/d/help/next-js-best-practices
 */

// Get connection string from environment variables
const connectionString = process.env.DATABASE_URL as string

const globalForPrisma = global as unknown as { db: PrismaClient }

// Use existing instance if available, otherwise create new
export const db = globalForPrisma.db || new PrismaClient()

// Only attach to global in development (prevents HMR connection exhaustion)
if (process.env.NODE_ENV !== "production") globalForPrisma.db = db

// For debugging Prisma issues (simplified for Edge Runtime)
export function debugPrismaEngine() {
  try {
    console.log(
      "Prisma connection URL:",
      connectionString?.substring(0, 20) + "..."
    )
    console.log("NODE_ENV:", process.env.NODE_ENV)

    return { status: "ok" }
  } catch (error) {
    console.error("Failed to debug Prisma engine:", error)
    return { error: error?.toString() }
  }
}
