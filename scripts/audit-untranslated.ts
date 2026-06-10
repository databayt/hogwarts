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
  "src/components/school-dashboard/document": ["Document"],
  "src/components/stream": ["StreamCourse", "StreamCategory", "Video"],
}

/**
 * Chain ROOTS that are never DB rows: dictionaries, params, form state, etc.
 * `{dictionary.events.title}` must not count as a raw Event.title render.
 */
const SAFE_ROOTS = new Set([
  "dictionary",
  "dict",
  "d",
  "t",
  "m",
  "messages",
  "labels",
  "label",
  "params",
  "searchParams",
  "props",
  "config",
  "options",
  "opts",
  "form",
  "formData",
  "values",
  "errors",
  "error",
  "e",
  "column",
  "columns",
  "meta",
  "metadata",
  "session",
  "page",
  "document",
  "window",
  "z",
  "schema",
])

/** Render surfaces for field detection — display views only, never forms
 * (a form EDITS source content; translating its inputs would be wrong). */
function isFieldSurface(path: string): boolean {
  return isRenderSurface(path) || /\/management[^/]*\.tsx$/.test(path)
}

function findFieldOffenders(): Offender[] {
  const offenders: Offender[] = []
  for (const [dir, models] of Object.entries(DIR_MODELS)) {
    const fields = Array.from(
      new Set(models.flatMap((m) => TRANSLATABLE[m]))
    ).sort()
    if (fields.length === 0) continue
    const accessRe = new RegExp(
      `\\b([A-Za-z_$][\\w$]*(?:\\.[A-Za-z_$][\\w$]*)*)\\.(${fields.join("|")})\\b`,
      "g"
    )
    let files: string[] = []
    try {
      const out = execSync(`find ${dir} -type f -name '*.tsx' 2>/dev/null`, {
        encoding: "utf8",
      })
      files = out.split("\n").filter(Boolean).filter(isFieldSurface)
    } catch {
      continue // dir doesn't exist (feature moved) — DIR_MODELS needs updating
    }
    for (const file of files) {
      const src = readFileSync(file, "utf8")
      if (TRANSLATION_HELPERS.test(src)) continue // file translates — trust it
      const lines = src.split("\n")
      lines.forEach((line, i) => {
        const trimmed = line.trim()
        if (
          trimmed.startsWith("//") ||
          trimmed.startsWith("*") ||
          trimmed.startsWith("import ")
        )
          return
        for (const match of line.matchAll(accessRe)) {
          const root = match[1].split(".")[0]
          if (SAFE_ROOTS.has(root)) continue
          offenders.push({
            file,
            line: i + 1,
            snippet: trimmed.slice(0, 120),
          })
          break // one offender per line is enough
        }
      })
    }
  }
  return offenders
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
      console.log("✅ No registry fields rendered raw.")
    } else {
      console.log(
        `\n⚠️  ${fieldOffenders.length} registry-field raw renders across ${
          new Set(fieldOffenders.map((o) => o.file)).size
        } files:\n`
      )
      for (const o of fieldOffenders) {
        console.log(`  ${o.file}:${o.line}\n    ${o.snippet}`)
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
