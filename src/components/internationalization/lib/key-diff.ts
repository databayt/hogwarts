// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Pure utilities for diffing two translation dictionaries.
 *
 * Used by `scripts/dev-i18n-sync.ts` (CLI) and any future CI gate that
 * wants to fail the build when AR/EN drift. Pure functions — no I/O, no
 * console, no chalk — so they're trivially testable and safe to import
 * from server actions or edge runtimes.
 */

/** Any JSON-shaped object. Translations are leaves, sub-namespaces are nested. */
export type Dictionary = {
  readonly [key: string]: Dictionary | string | number | boolean | null | unknown[]
}

/**
 * Walk a dictionary tree and return every leaf path as a dot-delimited string.
 *
 * Examples:
 *   {a:{b:"x"}} → ["a.b"]
 *   {a:["x"]}   → ["a"]   (arrays treated as leaves so we don't recurse into them)
 *   {a:null}    → ["a"]   (null is a leaf)
 *   {}          → []
 */
export function flattenKeys(obj: Dictionary, prefix = ""): string[] {
  const keys: string[] = []

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      keys.push(...flattenKeys(value as Dictionary, fullKey))
    } else {
      keys.push(fullKey)
    }
  }

  return keys
}

export interface KeyDiff {
  /** Keys present in `b` that are missing from `a`. */
  missingFromA: string[]
  /** Keys present in `a` that are missing from `b`. */
  missingFromB: string[]
}

/**
 * Generic key set diff. Returned arrays are sorted alphabetically so the
 * output is stable across runs (matters for CI logs and diff-on-fail).
 */
export function diffKeys(a: string[], b: string[]): KeyDiff {
  const setA = new Set(a)
  const setB = new Set(b)
  return {
    missingFromA: b.filter((k) => !setA.has(k)).sort(),
    missingFromB: a.filter((k) => !setB.has(k)).sort(),
  }
}

export interface TranslationFileDiff {
  /** Keys present in EN that the AR file is missing. */
  missingInAr: string[]
  /** Keys present in AR that the EN file is missing. */
  missingInEn: string[]
  /** True when both dictionaries have identical leaf paths. */
  isSynced: boolean
}

/**
 * Convenience wrapper for the dictionary-pair case (the script's primary
 * caller). Returns `isSynced: true` only when both sides have exactly the
 * same leaf paths.
 */
export function compareTranslationFiles(
  arContent: Dictionary,
  enContent: Dictionary
): TranslationFileDiff {
  const arKeys = flattenKeys(arContent)
  const enKeys = flattenKeys(enContent)
  const diff = diffKeys(arKeys, enKeys)
  return {
    missingInAr: diff.missingFromA,
    missingInEn: diff.missingFromB,
    isSynced: diff.missingFromA.length === 0 && diff.missingFromB.length === 0,
  }
}
