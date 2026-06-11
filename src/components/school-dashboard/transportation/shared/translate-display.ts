// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import type { Locale } from "@/components/internationalization/config"
import { getLabels } from "@/components/translation/person"

// Transportation content (route/stop names, addresses, notes) is stored in one
// language with a `lang` field. These helpers translate the user-authored text
// fields on demand into the viewer's locale (System B), so a route stored in
// Arabic reads in English when the dashboard is viewed in English. They run only
// in server components/actions — translation resolves through ONE batched
// `getLabels` call per invocation (dedupe + LRU/DB cache + transliteration
// fallback) and falls back to the source text on any failure, so callers never
// need a try/catch.

type TranslatableRow = { lang: string; schoolId: string }

/**
 * Core batched translator: collects every translatable field value across ALL
 * rows, resolves them in a single `getLabels` pass per tenant (rows in one call
 * share a schoolId in practice — multi-tenant queries are always school-scoped),
 * then rebuilds the rows from the resulting Map. Source value is kept on any
 * miss/failure; input rows are never mutated.
 */
async function translateRows<T extends TranslatableRow>(
  rows: T[],
  fields: readonly string[],
  displayLang: Locale
): Promise<T[]> {
  if (rows.length === 0) return rows

  // Collect deduped values per tenant (almost always exactly one schoolId
  // per call — multi-tenant queries are always school-scoped).
  const bySchool = new Map<string, Set<string>>()
  for (const row of rows) {
    let bucket = bySchool.get(row.schoolId)
    if (!bucket) {
      bucket = new Set()
      bySchool.set(row.schoolId, bucket)
    }
    for (const field of fields) {
      const v = (row as Record<string, unknown>)[field]
      if (typeof v === "string" && v !== "") bucket.add(v)
    }
  }

  // ONE batched resolution per tenant (getLabels caches + falls back internally).
  const maps = new Map<string, Map<string, string>>()
  await Promise.all(
    Array.from(bySchool.entries()).map(async ([schoolId, values]) => {
      if (values.size === 0) return
      try {
        maps.set(
          schoolId,
          await getLabels(Array.from(values), displayLang, schoolId)
        )
      } catch {
        // Never block a render — fall back to source text below.
        maps.set(schoolId, new Map())
      }
    })
  )

  // Rebuild rows from the Map — source fallback on any miss, no mutation.
  return rows.map((row) => {
    const map = maps.get(row.schoolId)
    if (!map || map.size === 0) return row
    let copy: T | null = null
    for (const field of fields) {
      const v = (row as Record<string, unknown>)[field]
      if (typeof v !== "string" || v === "") continue
      const translated = map.get(v)
      if (translated === undefined || translated === v) continue
      if (copy === null) copy = { ...row }
      ;(copy as Record<string, unknown>)[field] = translated
    }
    return copy ?? row
  })
}

type RouteLike = {
  name: string
  originName: string
  destinationName: string
  notes: string | null
  lang: string
  schoolId: string
}

const ROUTE_FIELDS = ["name", "originName", "destinationName", "notes"] as const

export async function translateRoute<T extends RouteLike>(
  route: T,
  displayLang: Locale
): Promise<T> {
  const [translated] = await translateRoutes([route], displayLang)
  return translated
}

export async function translateRoutes<T extends RouteLike>(
  routes: T[],
  displayLang: Locale
): Promise<T[]> {
  return translateRows(routes, ROUTE_FIELDS, displayLang)
}

type StopLike = {
  name: string
  address: string | null
  notes: string | null
  lang: string
  schoolId: string
}

const STOP_FIELDS = ["name", "address", "notes"] as const

export async function translateStop<T extends StopLike>(
  stop: T,
  displayLang: Locale
): Promise<T> {
  const [translated] = await translateStops([stop], displayLang)
  return translated
}

export async function translateStops<T extends StopLike>(
  stops: T[],
  displayLang: Locale
): Promise<T[]> {
  return translateRows(stops, STOP_FIELDS, displayLang)
}
