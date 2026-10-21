// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import "server-only"

import { createHash, randomBytes } from "node:crypto"
import { cookies } from "next/headers"

import { db } from "@/lib/db"
import { ensurePlatformSchool, PLATFORM_SCHOOL_ID } from "@/lib/platform-tenant"
import type { HostTenant } from "@/lib/tenant-host"

/**
 * The anonymous visitor's key. Host-only (no Domain), so each school site
 * and the main domain each know a visitor separately — nothing links one
 * school's visitor to another's. Rolled for 90 days on every write; the
 * retention cron deletes profiles idle longer than that.
 */
export const VISITOR_COOKIE = "bq_chat"
export const VISITOR_TTL_DAYS = 90
const KEY_RE = /^[A-Za-z0-9_-]{22}$/

export interface ChatProfile {
  id: string
  schoolId: string
  memoryEnabled: boolean
  /** An anonymous browser, not a signed-in member. */
  visitor: boolean
}

/** Only the hash is stored: a database leak is not a session hijack. */
export const keyHash = (key: string) =>
  createHash("sha256").update(key).digest("hex")

/** The tenant id a profile belongs to: the school, or the platform sentinel. */
export function profileTenant(tenant: HostTenant): string | null {
  if (tenant.kind === "school") return tenant.schoolId
  if (tenant.kind === "platform") return PLATFORM_SCHOOL_ID
  return null
}

const SELECT = { id: true, schoolId: true, memoryEnabled: true } as const

async function setVisitorCookie(key: string) {
  ;(await cookies()).set(VISITOR_COOKIE, key, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: VISITOR_TTL_DAYS * 24 * 60 * 60,
  })
}

/**
 * The profile of whoever is asking on this host: the member's when signed
 * in, else the browser's. Reads never create a profile or set a cookie —
 * only `write` does (the first message), the mkan rule: listing chats must
 * not mint identities.
 */
export async function profileFor(opts: {
  tenant: HostTenant
  userId?: string | null
  write: boolean
}): Promise<ChatProfile | null> {
  const schoolId = profileTenant(opts.tenant)
  if (!schoolId) return null

  if (opts.userId) {
    const where = { userId: opts.userId, schoolId }
    const found = await db.chatbotProfile.findFirst({ where, select: SELECT })
    if (found) {
      if (opts.write)
        await db.chatbotProfile.updateMany({
          where: { id: found.id, schoolId },
          data: { lastSeenAt: new Date() },
        })
      return { ...found, visitor: false }
    }
    if (!opts.write) return null
    if (schoolId === PLATFORM_SCHOOL_ID) await ensurePlatformSchool()
    try {
      const created = await db.chatbotProfile.create({
        data: where,
        select: SELECT,
      })
      return { ...created, visitor: false }
    } catch (error) {
      // Two first messages raced; the other one created it.
      if ((error as { code?: string }).code !== "P2002") throw error
      const again = await db.chatbotProfile.findFirst({ where, select: SELECT })
      return again ? { ...again, visitor: false } : null
    }
  }

  const raw = (await cookies()).get(VISITOR_COOKIE)?.value
  const key = raw && KEY_RE.test(raw) ? raw : null
  if (key) {
    const found = await db.chatbotProfile.findFirst({
      where: { keyHash: keyHash(key), schoolId },
      select: SELECT,
    })
    if (found) {
      if (opts.write) {
        await db.chatbotProfile.updateMany({
          where: { id: found.id, schoolId },
          data: { lastSeenAt: new Date() },
        })
        await setVisitorCookie(key)
      }
      return { ...found, visitor: true }
    }
  }
  if (!opts.write) return null

  // No cookie, or one whose profile was purged: a fresh key.
  const fresh = randomBytes(16).toString("base64url")
  if (schoolId === PLATFORM_SCHOOL_ID) await ensurePlatformSchool()
  const created = await db.chatbotProfile.create({
    data: { schoolId, keyHash: keyHash(fresh) },
    select: SELECT,
  })
  await setVisitorCookie(fresh)
  return { ...created, visitor: true }
}

/** "Forget this device": the visitor's profile, chats and notes, and the cookie. */
export async function forgetVisitor(tenant: HostTenant): Promise<boolean> {
  const schoolId = profileTenant(tenant)
  const raw = (await cookies()).get(VISITOR_COOKIE)?.value
  if (!schoolId || !raw || !KEY_RE.test(raw)) return false
  await db.chatbotProfile.deleteMany({
    where: { keyHash: keyHash(raw), schoolId },
  })
  ;(await cookies()).delete(VISITOR_COOKIE)
  return true
}
