// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * FCM push sender — the native (Android) channel of the notification queue.
 *
 * Talks to the FCM HTTP v1 API directly (no firebase-admin): a service
 * account JWT (RS256, node `crypto`) is exchanged for an OAuth2 access token,
 * cached in module scope until five minutes before it expires, and each
 * device token gets one `messages:send` call.
 *
 * Env (all three required, else the drain is a clean no-op):
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY   — literal `\n` sequences are normalised to newlines
 *
 * Device tokens live in `NotificationSubscription(entityType: "fcm_device[:android|:ios]",
 * entityId: <token>)` (api/mobile/notifications/register). A token FCM says is
 * gone is deactivated, never deleted.
 *
 * Why FCM does not read `pushSent`: Web Push (push-web.ts) claims every
 * `pushSent: false` row up front, and it runs first in the cron, so by the
 * time this drain looks the flag is already true for every row — including
 * the ones a phone is still owed. FCM therefore keeps its own claim in
 * `metadata.fcmClaimedAt` (taken atomically in SQL, released on a transient
 * failure) and only looks at the last 48 hours of rows belonging to users who
 * actually have a device.
 */

import { createSign } from "node:crypto"

import { db } from "@/lib/db"
import { resolveActionUrl } from "@/lib/dispatch-notification"

import { FCM_DEVICE_ENTITY_TYPES } from "./fcm-device"

const TOKEN_URL = "https://oauth2.googleapis.com/token"
const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging"
/** The worker never looks further back than this (the table is 255k+ rows). */
export const PUSH_LOOKBACK_MS = 48 * 60 * 60 * 1000
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000
const FETCH_TIMEOUT_MS = 10_000

/**
 * Notification channel ids the Android app creates
 * (core/push notification-handler.kt). There is no dedicated live-class
 * channel in the app yet, so live types ride the general one.
 */
export const FCM_CHANNELS = {
  general: "hogwarts_general",
  attendance: "hogwarts_attendance",
  grades: "hogwarts_grades",
  fees: "hogwarts_fees",
  messages: "hogwarts_messages",
  announcements: "hogwarts_announcements",
  // A high-importance channel created by app 1.3.4+; older apps fall back to FCM's default channel.
  live: "hogwarts_live",
} as const

export function fcmChannelFor(type: string): string {
  if (type.startsWith("live_class_")) return FCM_CHANNELS.live
  if (type.startsWith("attendance_") || type.startsWith("absence_"))
    return FCM_CHANNELS.attendance
  if (type === "grade_posted" || type === "assignment_graded")
    return FCM_CHANNELS.grades
  if (type.startsWith("fee_")) return FCM_CHANNELS.fees
  if (type === "message" || type === "message_mention")
    return FCM_CHANNELS.messages
  if (type === "announcement") return FCM_CHANNELS.announcements
  return FCM_CHANNELS.general
}

export interface PushProcessResult {
  processed: number
  succeeded: number
  failed: number
  /** Device tokens deactivated because FCM said they are gone. */
  deactivated?: number
  skippedReason?: "not_configured" | null
}

export function isFcmConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID?.trim() &&
    process.env.FIREBASE_CLIENT_EMAIL?.trim() &&
    process.env.FIREBASE_PRIVATE_KEY?.trim()
  )
}

// ── OAuth2 access token ─────────────────────────────────────────────

function normalisePrivateKey(raw: string): string {
  return raw
    .trim()
    .replace(/^"|"$/g, "")
    .replace(/\\n/g, "\n")
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url")
}

function buildJwt(nowSec: number): string {
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))
  const claims = b64url(
    JSON.stringify({
      iss: process.env.FIREBASE_CLIENT_EMAIL!.trim(),
      scope: FCM_SCOPE,
      aud: TOKEN_URL,
      iat: nowSec,
      exp: nowSec + 3600,
    })
  )
  const unsigned = `${header}.${claims}`
  const signature = createSign("RSA-SHA256")
    .update(unsigned)
    .sign(normalisePrivateKey(process.env.FIREBASE_PRIVATE_KEY!))
  return `${unsigned}.${b64url(signature)}`
}

let cachedToken: { value: string; expiresAt: number } | null = null
let inflightToken: Promise<string> | null = null

/** Test hook — forget the cached access token. */
export function resetFcmAccessToken(): void {
  cachedToken = null
  inflightToken = null
}

export async function getFcmAccessToken(): Promise<string> {
  const now = Date.now()
  if (cachedToken && cachedToken.expiresAt - TOKEN_REFRESH_MARGIN_MS > now) {
    return cachedToken.value
  }
  if (inflightToken) return inflightToken

  inflightToken = (async () => {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: buildJwt(Math.floor(now / 1000)),
      }).toString(),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!res.ok) {
      throw new Error(`FCM OAuth token request failed (${res.status})`)
    }
    const json = (await res.json()) as {
      access_token?: string
      expires_in?: number
    }
    if (!json.access_token) throw new Error("FCM OAuth response had no token")
    cachedToken = {
      value: json.access_token,
      expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
    }
    return cachedToken.value
  })().finally(() => {
    inflightToken = null
  })
  return inflightToken
}

// ── Message ─────────────────────────────────────────────────────────

export interface FcmNotificationInput {
  notificationId: string
  type: string
  title: string
  body: string
  /** Absolute link, resolved exactly as Web Push resolves it. */
  deepLink: string
  lang?: string | null
  priority?: string | null
  expiresAt?: Date | null
  metadata?: Record<string, unknown> | null
}

const RESERVED_DATA_KEY = /^(google|gcm|from$|notification$)/i

export function buildFcmMessage(token: string, n: FcmNotificationInput) {
  const data: Record<string, string> = {}
  for (const [k, v] of Object.entries(n.metadata ?? {})) {
    if (k === "url" || k === "deep_link" || RESERVED_DATA_KEY.test(k)) continue
    if (v === null || v === undefined) continue
    data[k] = typeof v === "string" ? v : JSON.stringify(v)
  }
  data.deep_link = n.deepLink
  data.notification_id = n.notificationId
  data.type = n.type
  data.lang = n.lang === "en" ? "en" : "ar"
  if (n.priority) data.priority = String(n.priority)

  // Same title/body Web Push shows (push-web.ts buildPushPayload).
  const body = n.body.length > 240 ? `${n.body.slice(0, 239)}…` : n.body

  // A class alert is worthless once the class is over: FCM drops it at expiry.
  const ttlSeconds = n.expiresAt
    ? Math.max(60, Math.floor((n.expiresAt.getTime() - Date.now()) / 1000))
    : 60 * 60 * 24

  return {
    message: {
      token,
      notification: { title: n.title, body },
      data,
      android: {
        priority: "HIGH",
        ttl: `${ttlSeconds}s`,
        notification: { channel_id: fcmChannelFor(n.type) },
      },
    },
  }
}

export type FcmSendOutcome =
  | { kind: "ok" }
  | { kind: "invalid_token"; detail: string }
  | { kind: "retry"; detail: string }
  | { kind: "fatal"; detail: string }

/** Send one message to one device token; never throws. */
export async function sendFcmMessage(
  token: string,
  n: FcmNotificationInput
): Promise<FcmSendOutcome> {
  try {
    const access = await getFcmAccessToken()
    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(
        process.env.FIREBASE_PROJECT_ID!.trim()
      )}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildFcmMessage(token, n)),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      }
    )
    if (res.ok) return { kind: "ok" }

    const payload = (await res.json().catch(() => null)) as {
      error?: {
        status?: string
        message?: string
        details?: Array<{ errorCode?: string }>
      }
    } | null
    const status = payload?.error?.status ?? ""
    const message = payload?.error?.message ?? ""
    const codes = (payload?.error?.details ?? []).map((d) => d.errorCode)
    const detail = `${res.status} ${status || codes[0] || ""} ${message}`
      .trim()
      .slice(0, 300)

    if (
      codes.includes("UNREGISTERED") ||
      codes.includes("SENDER_ID_MISMATCH") ||
      (res.status === 404 &&
        (status === "NOT_FOUND" || status === "UNREGISTERED" || !status)) ||
      (res.status === 400 &&
        status === "INVALID_ARGUMENT" &&
        /token|registration/i.test(message))
    ) {
      return { kind: "invalid_token", detail }
    }
    if (res.status === 401) {
      // Our cached access token was refused: mint a fresh one next time.
      cachedToken = null
      return { kind: "retry", detail }
    }
    if (res.status === 429 || res.status >= 500) {
      return { kind: "retry", detail }
    }
    return { kind: "fatal", detail }
  } catch (err) {
    return {
      kind: "retry",
      detail: err instanceof Error ? err.message : String(err),
    }
  }
}

// ── Device tokens ───────────────────────────────────────────────────

/** Retire a token FCM reported gone. Rows stay (audit); `active` goes false. */
export async function deactivateFcmToken(token: string): Promise<void> {
  await db.notificationSubscription.updateMany({
    where: { entityType: { in: [...FCM_DEVICE_ENTITY_TYPES] }, entityId: token },
    data: { active: false },
  })
}

async function loadDeviceTokens(): Promise<Map<string, string[]>> {
  const subs = await db.notificationSubscription.findMany({
    where: { entityType: { in: [...FCM_DEVICE_ENTITY_TYPES] }, active: true },
    select: { userId: true, entityId: true },
  })
  const byUser = new Map<string, string[]>()
  for (const s of subs) {
    const list = byUser.get(s.userId) ?? []
    if (!list.includes(s.entityId)) list.push(s.entityId)
    byUser.set(s.userId, list)
  }
  return byUser
}

// ── Queue ───────────────────────────────────────────────────────────

interface PendingRow {
  id: string
  userId: string
  schoolId: string
  type: string
  title: string
  body: string
  lang: string
  priority: string
  metadata: unknown
  expiresAt: Date | null
}

const PRIORITY_RANK: Record<string, number> = {
  urgent: 3,
  high: 2,
  normal: 1,
  low: 0,
}

async function pullPending(
  userIds: string[],
  limit: number
): Promise<PendingRow[]> {
  const now = new Date()
  const rows = await db.notification.findMany({
    where: {
      userId: { in: userIds },
      channels: { has: "push" },
      createdAt: { gte: new Date(now.getTime() - PUSH_LOOKBACK_MS) },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    // Newest first: already-sent rows age to the bottom of the window.
    orderBy: { createdAt: "desc" },
    take: Math.min(limit * 8, 2000),
    select: {
      id: true,
      userId: true,
      schoolId: true,
      type: true,
      title: true,
      body: true,
      lang: true,
      priority: true,
      metadata: true,
      expiresAt: true,
    },
  })
  return rows
    .filter((r) => {
      const m = r.metadata as Record<string, unknown> | null
      return !(m && typeof m === "object" && m.fcmClaimedAt)
    })
    .map((r) => ({ ...r, type: String(r.type), priority: String(r.priority) }))
    .sort(
      (a, b) =>
        (PRIORITY_RANK[b.priority] ?? 1) - (PRIORITY_RANK[a.priority] ?? 1)
    )
    .slice(0, limit)
}

/** Atomic: whoever flips `metadata.fcmClaimedAt` first owns the send. */
async function claim(id: string): Promise<boolean> {
  const n = await db.$executeRaw`
    UPDATE "notifications"
    SET "metadata" = jsonb_set(COALESCE("metadata", '{}'::jsonb), '{fcmClaimedAt}', to_jsonb(${new Date().toISOString()}::text))
    WHERE "id" = ${id}
      AND COALESCE("metadata", '{}'::jsonb)->'fcmClaimedAt' IS NULL`
  return n > 0
}

async function release(id: string): Promise<void> {
  await db.$executeRaw`
    UPDATE "notifications"
    SET "metadata" = COALESCE("metadata", '{}'::jsonb) - 'fcmClaimedAt'
    WHERE "id" = ${id}`
}

async function deepLinkFor(
  row: PendingRow,
  domainCache: Map<string, string>
): Promise<string> {
  const meta = (row.metadata as Record<string, unknown> | null) ?? null
  const preset = typeof meta?.deep_link === "string" ? meta.deep_link : null
  const raw =
    preset ?? (typeof meta?.url === "string" ? meta.url : "/notifications")
  let subdomain = domainCache.get(row.schoolId)
  if (subdomain === undefined) {
    const school = await db.school.findUnique({
      where: { id: row.schoolId },
      select: { domain: true },
    })
    subdomain = school?.domain ?? ""
    domainCache.set(row.schoolId, subdomain)
  }
  return resolveActionUrl(raw, subdomain, null, { locale: row.lang })
}

/**
 * Process up to `limit` queued notifications for users with a registered
 * device. A row is delivered when at least one device took it; a transient
 * failure (429/5xx/network) gives the claim back for the next tick. Users
 * with no device are not queried at all, so nothing retries for them.
 */
export async function processPendingPushNotifications(
  limit: number = 50
): Promise<PushProcessResult> {
  if (!isFcmConfigured()) {
    return {
      processed: 0,
      succeeded: 0,
      failed: 0,
      skippedReason: "not_configured",
    }
  }

  const tokensByUser = await loadDeviceTokens()
  if (tokensByUser.size === 0) {
    return { processed: 0, succeeded: 0, failed: 0, skippedReason: null }
  }
  const pending = await pullPending([...tokensByUser.keys()], limit)
  if (pending.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0, skippedReason: null }
  }

  const domainCache = new Map<string, string>()
  let processed = 0
  let succeeded = 0
  let failed = 0
  let deactivated = 0

  async function sendOne(row: PendingRow) {
    if (!(await claim(row.id))) return
    processed++

    const tokens = tokensByUser.get(row.userId) ?? []
    const meta = (row.metadata as Record<string, unknown> | null) ?? null
    const input: FcmNotificationInput = {
      notificationId: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      deepLink: await deepLinkFor(row, domainCache),
      lang: row.lang,
      priority: row.priority,
      expiresAt: row.expiresAt,
      metadata: meta,
    }

    let delivered = 0
    let retryable = false
    let lastError: string | null = null
    for (const token of tokens) {
      const out = await sendFcmMessage(token, input)
      if (out.kind === "ok") {
        delivered++
      } else if (out.kind === "invalid_token") {
        await deactivateFcmToken(token).catch(() => {})
        deactivated++
      } else {
        lastError = out.detail
        if (out.kind === "retry") retryable = true
      }
    }

    if (delivered > 0 || (!retryable && lastError === null)) {
      // Delivered, or every token was invalid (nothing left to retry).
      if (delivered > 0) succeeded++
    } else if (retryable) {
      await release(row.id)
      await db.notification.update({
        where: { id: row.id },
        data: { pushError: `fcm: ${lastError}`.slice(0, 1000) },
      })
      failed++
      console.error("[push-fcm] send failed, will retry", {
        notificationId: row.id,
        error: lastError,
      })
    } else {
      // Permanent rejection (bad payload): keep the claim so it never loops.
      await db.notification.update({
        where: { id: row.id },
        data: { pushError: `fcm: ${lastError}`.slice(0, 1000) },
      })
      failed++
      console.error("[push-fcm] send rejected", {
        notificationId: row.id,
        error: lastError,
      })
    }
  }

  const CONCURRENCY = 10
  for (let i = 0; i < pending.length; i += CONCURRENCY) {
    await Promise.all(pending.slice(i, i + CONCURRENCY).map(sendOne))
  }

  return { processed, succeeded, failed, deactivated, skippedReason: null }
}
