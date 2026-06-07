// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { translateBatch } from "./google"
import { getDisplayLang } from "./locale"
import { memoGet, memoSet } from "./memory-cache"
import { fieldsFor, type TranslatableModel } from "./registry"
import type { Lang } from "./types"
import { detectScript } from "./util"

/**
 * Translate a whole list of one model's rows into the viewer's language in a
 * SINGLE batched pass — the high-performance replacement for sprinkling
 * `getText(field, row.lang, lang, schoolId)` per field at every render site.
 *
 * Why it's fast:
 *   - One source language. We translate a value only when its script differs
 *     from the display language, so every needed translation is `other → lang`
 *     — a single `sourceLanguage`, hence a single DB query.
 *   - Three tiers, cheapest first: in-memory LRU (hot terms, 0 I/O) → ONE
 *     `db.translation.findMany` for the rest → Google batch ONLY for true misses
 *     (which prewarm-on-write makes rare). Today's code does N×M `findUnique`.
 *   - Script-truth. The source language is `detectScript(value)`, not the row's
 *     stored `lang` flag — so a mislabeled row never renders garbled, and the
 *     same rule in `prewarm` keeps cache keys aligned.
 *
 * Always returns NEW row copies (never mutates inputs) and falls back to the
 * source string on any failure — it never blocks or breaks a render.
 *
 * @param model  registered model name (see `registry.ts`)
 * @param rows   the rows to localize
 * @param opts   override the ambient `{ schoolId, lang }` (defaults from request)
 */
export async function localize<T extends Record<string, unknown>>(
  model: TranslatableModel | string,
  rows: T[],
  opts?: { schoolId?: string | null; lang?: Lang }
): Promise<T[]> {
  if (!rows || rows.length === 0) return rows
  const fields = fieldsFor(model)
  if (fields.length === 0) return rows

  const schoolId =
    opts?.schoolId !== undefined
      ? opts.schoolId
      : (await getTenantContext()).schoolId
  // Without a tenant we can't use the per-school cache — render source as-is.
  if (!schoolId) return rows

  const lang = opts?.lang ?? (await getDisplayLang())
  const displayLang: Lang = lang === "en" ? "en" : "ar"
  const sourceLang: Lang = displayLang === "en" ? "ar" : "en"

  // 1. Collect the unique values that actually need translating
  //    (non-empty strings whose script is NOT the display language).
  const needed = new Set<string>()
  for (const row of rows) {
    for (const field of fields) {
      const v = row[field]
      if (typeof v !== "string" || v.trim() === "") continue
      if (detectScript(v) === displayLang) continue
      needed.add(v)
    }
  }
  if (needed.size === 0) return rows

  // 2. Resolve: LRU → DB (one query) → Google (misses only).
  const resolved = new Map<string, string>()
  const dbWanted: string[] = []
  for (const src of needed) {
    const hit = memoGet(schoolId, sourceLang, displayLang, src)
    if (hit !== undefined) resolved.set(src, hit)
    else dbWanted.push(src)
  }

  if (dbWanted.length > 0) {
    try {
      const cached = await db.translation.findMany({
        where: {
          schoolId,
          sourceLanguage: sourceLang,
          targetLanguage: displayLang,
          sourceText: { in: dbWanted },
        },
        select: { sourceText: true, translatedText: true },
      })
      for (const c of cached) {
        resolved.set(c.sourceText, c.translatedText)
        memoSet(
          schoolId,
          sourceLang,
          displayLang,
          c.sourceText,
          c.translatedText
        )
      }
    } catch (err) {
      console.error("[localize] cache read failed:", err)
    }
  }

  // 3. Read-time fallback for anything neither prewarmed nor cached.
  const misses = dbWanted.filter((src) => !resolved.has(src))
  if (misses.length > 0) {
    try {
      const translations = await translateBatch(misses, sourceLang, displayLang)
      const fresh = misses.map((src, i) => ({
        src,
        translated: translations[i] ?? src,
      }))
      for (const { src, translated } of fresh) {
        resolved.set(src, translated)
        memoSet(schoolId, sourceLang, displayLang, src, translated)
      }
      // Persist so the next reader hits the cache (fire-and-forget).
      void db
        .$transaction(
          fresh.map(({ src, translated }) =>
            db.translation.upsert({
              where: {
                schoolId_sourceText_sourceLanguage_targetLanguage: {
                  schoolId,
                  sourceText: src,
                  sourceLanguage: sourceLang,
                  targetLanguage: displayLang,
                },
              },
              update: {
                hitCount: { increment: 1 },
                lastAccessedAt: new Date(),
              },
              create: {
                schoolId,
                sourceText: src,
                sourceLanguage: sourceLang,
                targetLanguage: displayLang,
                translatedText: translated,
                provider: "google",
              },
            })
          )
        )
        .catch(() => {})
    } catch (err) {
      // Google down / no key → fall back to source string (handled below).
      console.error("[localize] translate fallback failed:", err)
    }
  }

  // 4. Build localized copies (source string on any miss — never blocks render).
  return rows.map((row) => {
    let copy: T | null = null
    for (const field of fields) {
      const v = row[field]
      if (typeof v !== "string" || v.trim() === "") continue
      if (detectScript(v) === displayLang) continue
      const t = resolved.get(v)
      if (t === undefined || t === v) continue
      if (copy === null) copy = { ...row }
      ;(copy as Record<string, unknown>)[field] = t
    }
    return copy ?? row
  })
}

/** Single-entity convenience wrapper around {@link localize}. */
export async function localizeOne<T extends Record<string, unknown>>(
  model: TranslatableModel | string,
  row: T | null | undefined,
  opts?: { schoolId?: string | null; lang?: Lang }
): Promise<T | null | undefined> {
  if (!row) return row
  const [out] = await localize(model, [row], opts)
  return out
}
