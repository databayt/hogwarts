// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { db } from "@/lib/db"

import { translateBatch } from "./google"
import { memoSet } from "./memory-cache"
import { fieldsFor, type TranslatableModel } from "./registry"
import type { Lang } from "./types"
import { detectScript } from "./util"

/**
 * Pre-translate a just-written row's text fields into the OTHER language and
 * persist them in the per-school cache (and the in-memory LRU). This takes the
 * Google round-trip OFF the read path entirely: by the time anyone views the
 * content in the non-storage language, it's already a cache hit — so the user
 * never waits and never glimpses the source language.
 *
 * Call it AFTER the response via `after()` from `next/server` so the write
 * request returns immediately and never pays for translation:
 *
 *   import { after } from "next/server"
 *   after(() => prewarm("Announcement", created, { schoolId }))
 *
 * Idempotent and non-destructive: existing cache rows (including manual
 * `provider:"manual"` overrides) are never overwritten — prewarm only FILLS
 * gaps. Errors are swallowed; a failed prewarm just means the first reader pays
 * the read-time fallback instead.
 */
export async function prewarm(
  model: TranslatableModel | string,
  row: Record<string, unknown> | null | undefined,
  opts: { schoolId: string | null | undefined }
): Promise<void> {
  const schoolId = opts.schoolId
  if (!row || !schoolId) return
  const fields = fieldsFor(model)
  if (fields.length === 0) return

  // Group unique values by translation direction. Source = detectScript(value)
  // (same rule as localize, so cache keys line up); target = the opposite lang.
  const groups = new Map<string, { from: Lang; to: Lang; texts: Set<string> }>()
  for (const field of fields) {
    const v = row[field]
    if (typeof v !== "string" || v.trim() === "") continue
    const from = detectScript(v)
    const to: Lang = from === "en" ? "ar" : "en"
    const key = `${from}>${to}`
    const g = groups.get(key) ?? { from, to, texts: new Set<string>() }
    g.texts.add(v)
    groups.set(key, g)
  }

  for (const { from, to, texts } of groups.values()) {
    const list = [...texts]
    if (list.length === 0) continue
    try {
      const translations = await translateBatch(list, from, to, { retry: true })
      const rows = list
        .map((src, i) => ({ src, translated: translations[i] ?? "" }))
        .filter((r) => r.translated.trim() !== "")
      for (const { src, translated } of rows) {
        memoSet(schoolId, from, to, src, translated)
      }
      await db
        .$transaction(
          rows.map(({ src, translated }) =>
            db.translation.upsert({
              where: {
                schoolId_sourceText_sourceLanguage_targetLanguage: {
                  schoolId,
                  sourceText: src,
                  sourceLanguage: from,
                  targetLanguage: to,
                },
              },
              // Never clobber an existing translation (incl. manual overrides);
              // same source text is deterministic, so only touch recency.
              update: { lastAccessedAt: new Date() },
              create: {
                schoolId,
                sourceText: src,
                sourceLanguage: from,
                targetLanguage: to,
                translatedText: translated,
                provider: "google",
              },
            })
          )
        )
        .catch(() => {})
    } catch (err) {
      console.error("[prewarm] failed (non-fatal):", err)
    }
  }
}
