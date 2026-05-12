// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Duplicate detection.
 *
 * Two layers:
 *   1. Adapter recent-list (Upstash KV) — cheap, ~10ms, fires for the
 *      hogwarts #302/#303/#304 case where the same user double-clicks Submit.
 *   2. GitHub issue search (optional) — slower, runs only when KV misses.
 *      Caps at top 5 candidates.
 *
 * If similarity > 0.8 → return found.
 */

import type { IssueSearchHit } from "./github"
import { searchIssues } from "./github"
import type { ReportInputParsed } from "./schema"
import type { DuplicateMatch } from "./types"

const SIM_THRESHOLD = 0.8

export interface DedupContext {
  repo: string
  token: string
}

export async function findDuplicateOnGitHub(
  input: ReportInputParsed,
  ctx: DedupContext
): Promise<DuplicateMatch> {
  const url = new URL(input.pageUrl)
  const path = url.pathname
  // Cheap heuristic — search by leading 5 words of description and the page path.
  const firstWords = input.description
    .trim()
    .split(/\s+/)
    .slice(0, 5)
    .join(" ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .slice(0, 60)

  const query = `${firstWords} in:title label:report state:open`
  let hits: IssueSearchHit[] = []
  try {
    hits = await searchIssues({ ...ctx, query, limit: 5 })
  } catch {
    return { found: false }
  }

  for (const hit of hits) {
    if (!hit.body.includes(path)) continue
    const sim = jaccardSimilarity(input.description, hit.body)
    if (sim >= SIM_THRESHOLD) {
      return { found: true, issueNumber: hit.number, similarity: sim }
    }
  }
  return { found: false }
}

/**
 * Jaccard similarity on word sets — fast, no embedding model needed.
 * Good enough to catch verbatim re-submissions and minor edits.
 */
export function jaccardSimilarity(a: string, b: string): number {
  const setA = wordSet(a)
  const setB = wordSet(b)
  if (setA.size === 0 || setB.size === 0) return 0

  let intersection = 0
  for (const w of setA) if (setB.has(w)) intersection++

  return intersection / (setA.size + setB.size - intersection)
}

function wordSet(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[ً-ٰٟ]/g, "")
      .split(/[\s\p{P}]+/u)
      .filter((t) => t.length >= 3)
  )
}
