// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * POST /api/mobile/translate
 *
 * Per-entity on-demand translation for iOS / Android. Surfaces the
 * existing TranslationCache so mobile clients can display
 * announcements/assignments in the user's app language without each
 * client baking its own translation pipeline.
 *
 * Contract (issue #276):
 *   Request:  { entity_type, entity_id, target_lang }
 *   200:      { translated_text, cached, source_lang }
 *   400/401/403/404/501 on the usual paths.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { db } from "@/lib/db"
import { translateWithCache } from "@/components/translation/actions"

import { authenticate, isAuthError } from "../lib/authenticate"

const requestSchema = z.object({
  entity_type: z.enum(["announcement", "assignment"]),
  entity_id: z.string().min(1),
  target_lang: z.enum(["ar", "en"]),
})

interface EntitySnapshot {
  text: string
  source_lang: "ar" | "en"
}

/**
 * Pull the canonical translatable text + source language for a supported
 * entity. Returns null when the entity doesn't exist in this school
 * (tenant-isolated by schoolId).
 *
 * Whitelist-only — adding a new entity type means adding a case here AND
 * a route test, never trusting an arbitrary client-supplied table name.
 */
async function loadEntity(
  entityType: "announcement" | "assignment",
  entityId: string,
  schoolId: string
): Promise<EntitySnapshot | null> {
  switch (entityType) {
    case "announcement": {
      const row = await db.announcement.findFirst({
        where: { id: entityId, schoolId },
        select: { title: true, body: true, lang: true },
      })
      if (!row) return null
      // Announcement title and body are both translatable. We join them with
      // a delimiter the iOS client can split — keeps the round-trip to one
      // cache entry per (title, body) pair.
      const text = [row.title ?? "", row.body ?? ""].join("\n\n").trim()
      return { text, source_lang: row.lang as "ar" | "en" }
    }
    case "assignment": {
      const row = await db.assignment.findFirst({
        where: { id: entityId, schoolId },
        select: { title: true, description: true, lang: true },
      })
      if (!row) return null
      const text = [row.title, row.description ?? ""].join("\n\n").trim()
      return { text, source_lang: row.lang as "ar" | "en" }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: "Body must be valid JSON" },
        { status: 400 }
      )
    }

    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }
    const { entity_type, entity_id, target_lang } = parsed.data

    const snapshot = await loadEntity(entity_type, entity_id, auth.schoolId)
    if (!snapshot) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 })
    }
    if (!snapshot.text) {
      // Empty source text — nothing to translate, but still a 200 so the
      // client can cache the empty result without a special error path.
      return NextResponse.json({
        translated_text: "",
        cached: true,
        source_lang: snapshot.source_lang,
      })
    }

    // No-op when source equals target. Return cached=true so the client
    // knows it's free to memoize the response.
    if (snapshot.source_lang === target_lang) {
      return NextResponse.json({
        translated_text: snapshot.text,
        cached: true,
        source_lang: snapshot.source_lang,
      })
    }

    // Probe the cache directly so the response can honestly report whether
    // this was a hit or a fresh Google Translate call. translateWithCache
    // does the same lookup internally; the extra read costs ~1ms and the
    // honest signal helps the iOS analytics distinguish hit-rate decay
    // from real translation latency.
    const cacheHit = await db.translationCache.findUnique({
      where: {
        schoolId_sourceText_sourceLanguage_targetLanguage: {
          schoolId: auth.schoolId,
          sourceText: snapshot.text,
          sourceLanguage: snapshot.source_lang,
          targetLanguage: target_lang,
        },
      },
      select: { id: true },
    })

    const translated_text = await translateWithCache(
      snapshot.text,
      snapshot.source_lang,
      target_lang,
      auth.schoolId
    )

    return NextResponse.json({
      translated_text,
      cached: Boolean(cacheHit),
      source_lang: snapshot.source_lang,
    })
  } catch (error) {
    console.error("Mobile translate error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
