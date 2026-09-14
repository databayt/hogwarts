// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import {
  applyOfflineItems,
  OFFLINE_ITEM_ID,
  OFFLINE_SYNC_MAX_ITEMS,
} from "@/lib/offline/apply"
import { checkUserRateLimit } from "@/lib/rate-limit"

import { authenticate, isAuthError } from "../../lib/authenticate"
import { isTenantStorageUrl } from "../../lib/tenant-storage"

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        idempotency_key: OFFLINE_ITEM_ID,
        kind: z.enum([
          "progress",
          "complete",
          "quiz",
          "assignment",
          "attendance",
        ]),
        payload: z.unknown(),
        created_at: z.string().datetime({ offset: true }),
      })
    )
    .min(1)
    .max(OFFLINE_SYNC_MAX_ITEMS),
})

const snakeToCamel = (k: string) =>
  k.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase())
const camelToSnake = (k: string) =>
  k.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase()

/** Rename object keys at every depth; values (ids, text) are untouched. */
function renameKeys(value: unknown, rename: (k: string) => string): unknown {
  if (Array.isArray(value)) return value.map((v) => renameKeys(v, rename))
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [rename(k), renameKeys(v, rename)])
    )
  }
  return value
}

/**
 * POST /api/mobile/offline/sync — drain the app's outbox (bearer token)
 *
 * Body: { items: [{ idempotency_key, kind, payload, created_at }] } (1–50),
 * kind ∈ progress | complete | quiz | assignment | attendance, payload keys in
 * snake_case:
 *   progress   { lesson_id, watched_seconds, total_seconds }
 *   complete   { lesson_id }
 *   quiz       { lesson_id, answers: [{ question_id, selected_option_index?, answer_text? }] }
 *   assignment { assignment_id, content?, attachments?: [url] }
 *   attendance { section_id, date, absent_student_ids, late_student_ids }
 *
 * Returns { results: [{ idempotency_key, result, code?, data? }], server_time }
 * in input order; result ∈ applied | duplicate | rejected. Same apply logic as
 * the web drain (src/lib/offline/apply.ts), so replays are idempotent on the
 * key and one rejected item never blocks the rest.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const rl = await checkUserRateLimit(
      auth.userId,
      { windowMs: 60 * 1000, maxRequests: 20 },
      "offline-sync"
    )
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    let json: unknown
    try {
      json = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 })
    }

    const verdicts = await applyOfflineItems(
      parsed.data.items.map((i) => ({
        id: i.idempotency_key,
        kind: i.kind,
        payload: renameKeys(i.payload, snakeToCamel),
        createdAt: i.created_at,
      })),
      {
        userId: auth.userId,
        schoolId: auth.schoolId,
        role: auth.role,
        acceptAttachment: (url) => isTenantStorageUrl(url, auth.schoolId),
      }
    )

    return NextResponse.json(
      {
        results: verdicts.map((v) => ({
          idempotency_key: v.id,
          result: v.result,
          ...(v.code ? { code: v.code } : {}),
          ...(v.data !== undefined
            ? { data: renameKeys(v.data, camelToSnake) }
            : {}),
        })),
        server_time: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    )
  } catch (error) {
    console.error("Mobile offline sync error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
