// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Dynamic-content i18n audit.
 *
 * The static-string tooling (.claude/hooks/check-i18n.sh, /i18n-check) catches
 * hardcoded English in JSX/toasts. It does NOT catch the other half of the problem:
 * rendering DB content (person names, classroom/subject names, titles…) WITHOUT
 * routing it through the on-demand translation helpers — which is why `/en` pages
 * keep regressing to Arabic.
 *
 * This script finds render surfaces that compose a person name
 * (`${x.firstName} ${x.lastName}`, `firstName + … + lastName`,
 * `[firstName, …, lastName].join`) but never import a translation helper (now
 * including `localize` — the registry-driven batched path). Those rows reach the
 * UI as raw stored (usually Arabic) text.
 *
 * NEXT STEP (see translation-guide “Areas of improvement”): extend detection
 * beyond person-names to ANY registered translatable field (registry.ts) rendered
 * raw — designed deliberately to keep the ratchet baseline meaningful.
 *
 * Usage:
 *   pnpm i18n:audit-content                           # human report
 *   pnpm tsx scripts/audit-untranslated.ts --json     # machine list (for the sweep)
 *
 * Regression gate: `findOffenders` is exercised as a ratchet in
 * `src/tests/i18n/audit-untranslated.test.ts` (Vitest
 * unit suite) — a new offender fails `pnpm test`. Burn the backlog down and
 * lower the test's BASELINE to lock in each win.
 */
import { execSync } from "node:child_process"
import { readFileSync } from "node:fs"

/** Helpers that mean "this file translates its content". */
const TRANSLATION_HELPERS =
  /\blocalize\b|getText|getFields|getName|getNames|getLabels|formatName|transliterate|content-display/

/** Person-name composition patterns that ship raw text to the UI. */
const NAME_COMPOSITION: RegExp[] = [
  // `${x.firstName} ${x.lastName}` (template literal, any middle parts)
  /\$\{[^}]*\.(firstName|givenName)\b[^}]*\}\s*\$\{[^}]*\.(lastName|surname)\b/,
  // `x.firstName + " " + x.lastName`
  /\.(firstName|givenName)\b\s*\+[^;\n]*\.(lastName|surname)\b/,
  // `[x.firstName, x.middleName, x.lastName].filter(...).join(...)`
  /\[[^\]]*\.(firstName|givenName)\b[^\]]*\.(lastName|surname)\b[^\]]*\]\s*\.\s*(filter|join)/,
]

/**
 * Only RENDER surfaces are in scope — places whose output is shown to a user.
 * Search/export/notification/internal-logic code that merely touches firstName is
 * intentionally excluded (translating a search key or a log line is wrong).
 */
function isRenderSurface(path: string): boolean {
  if (!/\.(tsx|ts)$/.test(path)) return false
  if (/__tests__|\.test\.|\.spec\.|\/scripts\//.test(path)) return false
  return (
    /content\.tsx$/.test(path) ||
    /-content\.tsx$/.test(path) ||
    /columns\.tsx$/.test(path) ||
    /content\.ts$/.test(path) ||
    /\/(card|detail|list|table|grid|roster)[^/]*\.tsx$/.test(path)
  )
}

function listCandidateFiles(): string[] {
  const out = execSync(
    `grep -rlE '(firstName|givenName)' src/components src/app --include='*.tsx' --include='*.ts' || true`,
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
  )
  return out.split("\n").filter(Boolean).filter(isRenderSurface)
}

interface Offender {
  file: string
  line: number
  snippet: string
}

function findOffenders(): Offender[] {
  const offenders: Offender[] = []
  for (const file of listCandidateFiles()) {
    const src = readFileSync(file, "utf8")
    if (TRANSLATION_HELPERS.test(src)) continue // file translates somewhere — trust it
    const lines = src.split("\n")
    lines.forEach((line, i) => {
      if (NAME_COMPOSITION.some((re) => re.test(line))) {
        offenders.push({
          file,
          line: i + 1,
          snippet: line.trim().slice(0, 120),
        })
      }
    })
  }
  return offenders
}

export { findOffenders, isRenderSurface, NAME_COMPOSITION, TRANSLATION_HELPERS }

// Run directly (not when imported by the guard tests).
if (process.argv[1] && process.argv[1].includes("audit-untranslated")) {
  const offenders = findOffenders()
  if (process.argv.includes("--json")) {
    const files = Array.from(new Set(offenders.map((o) => o.file)))
    console.log(JSON.stringify(files, null, 2))
  } else {
    if (offenders.length === 0) {
      console.log("✅ No untranslated person-name render surfaces found.")
    } else {
      console.log(
        `⚠️  ${offenders.length} untranslated name renders across ${
          new Set(offenders.map((o) => o.file)).size
        } files:\n`
      )
      for (const o of offenders) {
        console.log(`  ${o.file}:${o.line}\n    ${o.snippet}`)
      }
    }
  }
}
