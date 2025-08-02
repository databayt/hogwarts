import { PrismaClient } from "@prisma/client";

// Get connection string from environment variables
const connectionString = process.env.DATABASE_URL as string;

// Simplified Prisma client initialization for Edge Runtime compatibility

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { db: PrismaClient };

export const db = globalForPrisma.db || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.db = db;

// For debugging Prisma issues (simplified for Edge Runtime)
export function debugPrismaEngine() {
  try {
    console.log("Prisma connection URL:", connectionString?.substring(0, 20) + "...");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    
    return { status: "ok" };
  } catch (error) {
    console.error("Failed to debug Prisma engine:", error);
    return { error: error?.toString() };
  }
}
