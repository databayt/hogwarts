// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Real-file dictionary parity checker.
 *
 * Reads the actual en/ar dictionary JSON pairs from disk and reports key
 * drift using the pure diff engine in ./key-diff. No console, no
 * process.exit — consumed by BOTH:
 *   - `scripts/dev-i18n-sync.ts` (CLI: pnpm i18n:check / i18n:fix)
 *   - `src/tests/i18n/dictionary-parity.test.ts` (the CI translation guard)
 */
import { existsSync, readdirSync, readFileSync } from "fs"
import { join } from "path"

import {
  compareTranslationFiles,
  type Dictionary,
  type TranslationFileDiff,
} from "./key-diff"

export interface DictionaryPairReport {
  /** Human label, e.g. "General (ar.json / en.json)" or "transportation.json". */
  label: string
  /** Bare file name of the AR side (module pairs share one name). */
  arFile: string
  enFile: string
  /** True for the 4 root pairs (en.json, school-*.json, ...). */
  topLevel: boolean
  diff: TranslationFileDiff
}

export interface ParityReport {
  pairs: DictionaryPairReport[]
  /** Module dictionary files present in ar/ but not en/ (or vice versa). */
  filesOnlyInAr: string[]
  filesOnlyInEn: string[]
  totalMissingInAr: number
  totalMissingInEn: number
  isSynced: boolean
}

export const TOP_LEVEL_PAIRS = [
  { ar: "ar.json", en: "en.json", label: "General" },
  { ar: "school-ar.json", en: "school-en.json", label: "School" },
  { ar: "stream-ar.json", en: "stream-en.json", label: "Stream" },
  { ar: "operator-ar.json", en: "operator-en.json", label: "Operator" },
] as const

export const DEFAULT_I18N_ROOT = join(
  process.cwd(),
  "src",
  "components",
  "internationalization"
)

function readJson(path: string): Dictionary {
  return JSON.parse(readFileSync(path, "utf-8")) as Dictionary
}

/**
 * Compare every en/ar dictionary pair on disk: the 4 top-level pairs plus
 * all module files under dictionaries/{en,ar}/.
 */
export function checkDictionaryParity(
  i18nRoot: string = DEFAULT_I18N_ROOT
): ParityReport {
  const pairs: DictionaryPairReport[] = []

  for (const pair of TOP_LEVEL_PAIRS) {
    const arPath = join(i18nRoot, pair.ar)
    const enPath = join(i18nRoot, pair.en)
    if (!existsSync(arPath) || !existsSync(enPath)) continue
    pairs.push({
      label: `${pair.label} (${pair.ar} / ${pair.en})`,
      arFile: pair.ar,
      enFile: pair.en,
      topLevel: true,
      diff: compareTranslationFiles(readJson(arPath), readJson(enPath)),
    })
  }

  const arDir = join(i18nRoot, "dictionaries", "ar")
  const enDir = join(i18nRoot, "dictionaries", "en")
  const arFiles = readdirSync(arDir)
    .filter((f) => f.endsWith(".json"))
    .sort()
  const enFiles = readdirSync(enDir)
    .filter((f) => f.endsWith(".json"))
    .sort()

  for (const file of arFiles) {
    if (!enFiles.includes(file)) continue
    pairs.push({
      label: file,
      arFile: file,
      enFile: file,
      topLevel: false,
      diff: compareTranslationFiles(
        readJson(join(arDir, file)),
        readJson(join(enDir, file))
      ),
    })
  }

  const filesOnlyInAr = arFiles.filter((f) => !enFiles.includes(f))
  const filesOnlyInEn = enFiles.filter((f) => !arFiles.includes(f))

  const totalMissingInAr = pairs.reduce(
    (n, p) => n + p.diff.missingInAr.length,
    0
  )
  const totalMissingInEn = pairs.reduce(
    (n, p) => n + p.diff.missingInEn.length,
    0
  )

  return {
    pairs,
    filesOnlyInAr,
    filesOnlyInEn,
    totalMissingInAr,
    totalMissingInEn,
    isSynced:
      totalMissingInAr === 0 &&
      totalMissingInEn === 0 &&
      filesOnlyInAr.length === 0 &&
      filesOnlyInEn.length === 0,
  }
}

export interface PlaceholderHit {
  file: string
  key: string
  value: string
}

function collectPlaceholders(
  obj: Dictionary,
  file: string,
  prefix: string,
  out: PlaceholderHit[]
): void {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === "string") {
      if (value.startsWith("[AR] ") || value.startsWith("[EN] ")) {
        out.push({ file, key: fullKey, value })
      }
    } else if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      collectPlaceholders(value as Dictionary, file, fullKey, out)
    }
  }
}

/**
 * Find untranslated `[AR] …` / `[EN] …` placeholder values (scaffolded by
 * `pnpm i18n:fix`) that were committed without being translated.
 */
export function findUntranslatedPlaceholders(
  i18nRoot: string = DEFAULT_I18N_ROOT
): PlaceholderHit[] {
  const hits: PlaceholderHit[] = []

  for (const pair of TOP_LEVEL_PAIRS) {
    for (const file of [pair.ar, pair.en]) {
      const path = join(i18nRoot, file)
      if (existsSync(path)) collectPlaceholders(readJson(path), file, "", hits)
    }
  }

  for (const lang of ["ar", "en"] as const) {
    const dir = join(i18nRoot, "dictionaries", lang)
    for (const file of readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .sort()) {
      collectPlaceholders(
        readJson(join(dir, file)),
        `${lang}/${file}`,
        "",
        hits
      )
    }
  }

  return hits
}

/** Stable, human-readable drift summary for test failure messages / CI logs. */
export function formatParityReport(report: ParityReport): string {
  const lines: string[] = []
  for (const pair of report.pairs) {
    for (const key of pair.diff.missingInAr) {
      lines.push(`${pair.label}: "${key}" missing in AR`)
    }
    for (const key of pair.diff.missingInEn) {
      lines.push(`${pair.label}: "${key}" missing in EN`)
    }
  }
  for (const f of report.filesOnlyInAr) lines.push(`file only in ar/: ${f}`)
  for (const f of report.filesOnlyInEn) lines.push(`file only in en/: ${f}`)
  return lines.join("\n")
}
