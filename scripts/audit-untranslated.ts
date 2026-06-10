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
 * THREE detectors, three independent ratchets (src/tests/i18n/audit-untranslated.test.ts):
 *   1. findOffenders()      — person names composed raw (the original gate)
 *   2. findFieldOffenders() — registry fields (registry.ts) rendered raw on a
 *                             render surface whose feature dir maps to that model
 *   3. findPrewarmGaps()    — school-scoped registered models whose write
 *                             actions never prewarm (first cross-lang reader
 *                             pays the Google round-trip)
 *
 * Usage:
 *   pnpm i18n:audit-content                           # human report (all three)
 *   pnpm tsx scripts/audit-untranslated.ts --json     # machine list (for the sweep)
 *
 * Regression gate: each detector is exercised as a ratchet — a new offender
 * fails `pnpm test`. Burn the backlog down and lower the test's BASELINE to
 * lock in each win.
 */
import { execSync } from "node:child_process"
import { readFileSync } from "node:fs"

import {
  CATALOG_GLOBAL,
  TRANSLATABLE,
} from "../src/components/translation/registry"

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
      // Search/filter KEYS are not display text — translating them is wrong
      // (the matcher compares against stored values). Skip them.
      if (/\.toLowerCase\(\)/.test(line)) return
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

// ---------------------------------------------------------------------------
// Detector 2: features rendering a registered model with ZERO translation
// ---------------------------------------------------------------------------

/**
 * Feature-dir → registered model(s). Deliberately EXPLICIT (not inferred).
 * Add a line when a feature dir starts rendering a registered model.
 */
const DIR_MODELS: Record<string, (keyof typeof TRANSLATABLE)[]> = {
  "src/components/school-dashboard/listings/announcements": [
    "Announcement",
    "AnnouncementTemplate",
  ],
  "src/components/school-dashboard/listings/events": ["Event"],
  "src/components/school-dashboard/listings/subjects": [
    "Subject",
    "Chapter",
    "Lesson",
    "Material",
  ],
  "src/components/school-dashboard/listings/classes": ["Class", "Section"],
  "src/components/school-dashboard/listings/classrooms": [
    "Classroom",
    "ClassroomType",
  ],
  "src/components/school-dashboard/listings/assignments": ["Assignment"],
  "src/components/school-dashboard/listings/teachers/departments": [
    "Department",
  ],
  "src/components/school-dashboard/listings/students/year-levels": [
    "YearLevel",
  ],
  "src/components/school-dashboard/exams": [
    "Exam",
    "ExamTemplate",
    "Quiz",
    "QuickAssessment",
    "GradingScheme",
  ],
  "src/components/school-dashboard/library": ["Book"],
  "src/components/library": ["Book", "Textbook"],
  "src/components/school-dashboard/conference": ["Conference"],
  "src/components/school-dashboard/notifications": ["Notification"],
  "src/components/school-dashboard/transportation/routes": ["Route"],
  // Document + Section: registered, but no dedicated render surface yet —
  // they get a DIR_MODELS line the day one exists.
  "src/components/stream": ["StreamCourse", "StreamCategory", "Video"],
}

interface FeatureGap {
  model: string
  dir: string
}

/**
 * Display-translation markers. Any of these anywhere in the feature dir means
 * the feature's DATA BOUNDARY translates — server code localizes, client
 * surfaces (table/columns/detail) render the pre-localized props they're
 * given. (Client components can't import the server-only helpers, so
 * file-level detection would flag them forever; the FEATURE is the honest
 * unit of coverage. Partial gaps inside a covered feature — e.g. one view
 * fed by an unlocalized query — are sweep work, not ratchet work.)
 */
const DISPLAY_HELPERS = /\blocalize(One)?\b|\bgetText\b|\bgetFields\b/

function findFieldOffenders(): FeatureGap[] {
  const gaps: FeatureGap[] = []
  for (const [dir, models] of Object.entries(DIR_MODELS)) {
    let srcs: string[] = []
    try {
      const out = execSync(
        `find ${dir} -type f \\( -name '*.ts' -o -name '*.tsx' \\) 2>/dev/null`,
        { encoding: "utf8" }
      )
      srcs = out
        .split("\n")
        .filter(Boolean)
        .filter((f) => !/\.test\.|\.spec\./.test(f))
    } catch {
      srcs = []
    }
    if (srcs.length === 0) {
      // Dir vanished — DIR_MODELS is stale; surface that instead of hiding it.
      for (const model of models) gaps.push({ model, dir: `${dir} (missing)` })
      continue
    }
    const translates = srcs.some((f) =>
      DISPLAY_HELPERS.test(readFileSync(f, "utf8"))
    )
    if (!translates) for (const model of models) gaps.push({ model, dir })
  }
  return gaps
}

// ---------------------------------------------------------------------------
// Detector 3: write paths that never prewarm
// ---------------------------------------------------------------------------

interface PrewarmGap {
  model: string
  file: string
}

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

/**
 * School-scoped registered models whose create/update/upsert call sites never
 * import `prewarm` — their first cross-language reader pays the blocking
 * Google round-trip instead of a cache hit. CATALOG_GLOBAL models are exempt
 * (operator-context writes have no tenant to warm — see registry.ts).
 */
function findPrewarmGaps(): PrewarmGap[] {
  const gaps: PrewarmGap[] = []
  const models = (
    Object.keys(TRANSLATABLE) as (keyof typeof TRANSLATABLE)[]
  ).filter((m) => !CATALOG_GLOBAL.has(m))
  const accessors = models.map((m) => [m, lowerFirst(m)] as const)
  const altern = accessors.map(([, a]) => a).join("|")
  let files: string[] = []
  try {
    const out = execSync(
      `grep -rlE '\\.(${altern})\\.(create|update|upsert)\\(' src/components src/app --include='*.ts' || true`,
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
    )
    files = out
      .split("\n")
      .filter(Boolean)
      .filter(
        (f) =>
          !/\.test\.|\.spec\.|\/tests\/|\/translation\/|\/scripts\//.test(f)
      )
  } catch {
    return gaps
  }
  for (const file of files) {
    const src = readFileSync(file, "utf8")
    if (/\bprewarm\b/.test(src)) continue // file prewarm — trust it
    for (const [model, accessor] of accessors) {
      const writeRe = new RegExp(`\\.${accessor}\\.(create|update|upsert)\\(`)
      if (writeRe.test(src)) gaps.push({ model, file })
    }
  }
  return gaps
}

export {
  findFieldOffenders,
  findOffenders,
  findPrewarmGaps,
  isRenderSurface,
  NAME_COMPOSITION,
  TRANSLATION_HELPERS,
}

// Run directly (not when imported by the guard tests).
if (process.argv[1] && process.argv[1].includes("audit-untranslated")) {
  const offenders = findOffenders()
  const fieldOffenders = findFieldOffenders()
  const prewarmGaps = findPrewarmGaps()
  if (process.argv.includes("--json")) {
    console.log(
      JSON.stringify(
        {
          personNameFiles: Array.from(new Set(offenders.map((o) => o.file))),
          fieldOffenders,
          prewarmGaps,
        },
        null,
        2
      )
    )
  } else {
    if (offenders.length === 0) {
      console.log("✅ No untranslated person-name render surfaces.")
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
    if (fieldOffenders.length === 0) {
      console.log("\n✅ Every mapped feature translates its registered model.")
    } else {
      console.log(
        `\n⚠️  ${fieldOffenders.length} registered models rendered with ZERO translation in their feature:\n`
      )
      for (const o of fieldOffenders) {
        console.log(`  ${o.model} → ${o.dir}`)
      }
    }
    if (prewarmGaps.length === 0) {
      console.log("✅ Every school-scoped registered write path prewarm.")
    } else {
      console.log(
        `\n⚠️  ${prewarmGaps.length} write paths never prewarm (model → file):\n`
      )
      for (const g of prewarmGaps) {
        console.log(`  ${g.model} → ${g.file}`)
      }
    }
  }
}
