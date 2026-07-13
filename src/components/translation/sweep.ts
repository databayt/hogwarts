// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Registry-driven translation-cache sweep — the shared core behind
 * `pnpm i18n:backfill` (scripts/prewarm-existing.ts) and the daily
 * `/api/cron/translation-sweep` self-heal.
 *
 * Walks every school × every registered model (registry.ts TRANSLATABLE) plus
 * person names (students/teachers/guardians/staff — the highest-visibility
 * strings on every table and dropdown, which the registry deliberately does
 * not cover because Student isn't a content model), and fills the per-school
 * Translation cache for anything missing.
 *
 * Guarantees:
 * - Direction is per-value script truth (detectScript) — cache keys line up
 *   EXACTLY with what localize()/translate() compute at read time.
 * - CREATE-ONLY (createMany skipDuplicates): existing rows, including
 *   provider:"manual" human overrides, are never touched.
 * - Same text is never sent to a provider twice in one run, even across
 *   schools (global memo) — catalog content costs one API call, N row writes.
 * - Bounded: maxTranslations / deadlineMs caps make it safe inside a cron
 *   window; `exhausted: true` in the result means "run me again, more remains".
 * - Never aborts on a batch error — logs, counts, continues.
 */

import { db } from "@/lib/db"

import { translateBatch } from "./engine"
import {
  CATALOG_GLOBAL,
  TRANSLATABLE,
  type TranslatableModel,
} from "./registry"
import { detectScript, fullName } from "./util"

const PAGE_SIZE = 500
// 50 strings ≈ ~1.2k LLM tokens — a gentle step against Groq's free-tier
// 6k tokens/min window (Google chunks internally regardless of this size).
const TRANSLATE_CHUNK = 50
// Long bodies (announcement text…) are translated on demand at read time and
// cached then — sweeping them would burn budget on rarely-read paragraphs.
const MAX_VALUE_CHARS = 1500

/** Most-visible content first, heavy catalog long-tail last — so bounded cron
 * runs always spend their budget where users actually look. */
const MODEL_ORDER: TranslatableModel[] = [
  "Announcement",
  "Event",
  "Subject",
  "Class",
  "Section",
  "Classroom",
  "ClassroomType",
  "Department",
  "YearLevel",
  "GradingScheme",
  "Exam",
  "ExamTemplate",
  "Quiz",
  "QuickAssessment",
  "Assignment",
  "Conference",
  "Route",
  "Book",
  "Textbook",
  "Document",
  "StreamCourse",
  "StreamCategory",
  "Video",
  "AnnouncementTemplate",
  "Curriculum",
  "CurriculumStandard",
  "Material",
  "Chapter",
  "Lesson",
]

/** Transient per-user rows: 40k+ in prod, high churn, prewarmed on write and
 * localized on read — backfilling old ones is wasted budget. Opt in via
 * `models` if ever needed. */
const EXCLUDED_BY_DEFAULT: ReadonlySet<TranslatableModel> = new Set([
  "Notification",
])

/** Person-name sources — pseudo-models translated as composed full names,
 * exactly the string getNames()/getName() look up at render time. */
const NAME_SOURCES = [
  {
    model: "StudentName",
    accessor: "student",
    fields: ["firstName", "middleName", "lastName"],
  },
  {
    model: "TeacherName",
    accessor: "teacher",
    fields: ["firstName", "lastName"],
  },
  {
    model: "GuardianName",
    accessor: "guardian",
    fields: ["firstName", "lastName"],
  },
  {
    model: "StaffName",
    accessor: "staffMember",
    fields: ["firstName", "lastName"],
  },
] as const

/** Seed/test tenants nobody browses — excluded unless includeAllSchools. */
function isJunkSchool(school: { id: string; domain: string | null }): boolean {
  if (school.id === "platform") return true
  const d = school.domain ?? ""
  return d === "" || /^cache-test-/.test(d) || /^school-[a-z0-9]+-\d+$/.test(d)
}

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

export interface SweepOptions {
  /** Limit to these school subdomains (default: all real schools). */
  schoolDomains?: string[]
  /** Also sweep seed/test tenants (default false). */
  includeAllSchools?: boolean
  /** Registered models to sweep (default: all except Notification, visible-first). */
  models?: TranslatableModel[]
  /** Sweep person names too (default true). */
  includeNames?: boolean
  /** Actually translate + write (default false = dry-run counting). */
  translate?: boolean
  /** Stop after this many strings have been sent to a provider. */
  maxTranslations?: number
  /** Wall-clock budget in ms — checked between chunks. */
  deadlineMs?: number
  /** Sleep between provider calls (rate-limit kindness; default 0). */
  throttleMs?: number
  log?: (msg: string) => void
}

export interface SweepUnitStat {
  school: string
  model: string
  rows: number
  unique: number
  chars: number
}

export interface SweepResult {
  schools: number
  /** Per school/model scan stats (dry-run and execute both fill this). */
  units: SweepUnitStat[]
  /** Unique (direction, text) pairs seen across the whole run. */
  unique: number
  chars: number
  /** Cache misses found (execute mode only — dry run doesn't query the cache). */
  misses: number
  /** Strings actually sent to a translation provider. */
  translated: number
  /** Cache rows written. */
  written: number
  /** Values skipped for exceeding MAX_VALUE_CHARS. */
  longSkipped: number
  errors: number
  /** True when a cap stopped the run early — re-run to continue. */
  exhausted: boolean
}

interface Delegate {
  findMany: (args: object) => Promise<Record<string, unknown>[]>
}

function getDelegate(accessor: string): Delegate | undefined {
  const delegate = (db as unknown as Record<string, Delegate | undefined>)[
    accessor
  ]
  return delegate?.findMany ? delegate : undefined
}

/** Paginate a delegate, extracting non-empty string values of `fields`.
 * When `composeName` is set, rows compose to a single fullName value. */
async function collectValues(
  delegate: Delegate,
  where: object,
  fields: readonly string[],
  composeName: boolean,
  onSkipLong: () => void,
  log: (msg: string) => void,
  label: string
): Promise<{ values: string[]; rows: number }> {
  const values: string[] = []
  let rows = 0
  let cursor: string | undefined
  for (;;) {
    let page: Record<string, unknown>[]
    try {
      page = await delegate.findMany({
        where,
        select: Object.fromEntries([
          ["id", true],
          ...fields.map((f) => [f, true]),
        ]),
        take: PAGE_SIZE,
        orderBy: { id: "asc" },
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      })
    } catch (e) {
      log(
        `  [skip] ${label} page failed: ${e instanceof Error ? e.message : e}`
      )
      break
    }
    if (page.length === 0) break
    rows += page.length
    for (const row of page) {
      if (composeName) {
        const v = fullName(
          row as { firstName?: string; middleName?: string; lastName?: string }
        )
        if (v) values.push(v)
        continue
      }
      for (const f of fields) {
        const v = row[f]
        if (typeof v !== "string" || v.trim() === "") continue
        if (v.length > MAX_VALUE_CHARS) {
          onSkipLong()
          continue
        }
        values.push(v)
      }
    }
    cursor = page[page.length - 1].id as string
    if (page.length < PAGE_SIZE) break
  }
  return { values, rows }
}

export async function sweepTranslations(
  opts: SweepOptions = {}
): Promise<SweepResult> {
  const log = opts.log ?? (() => {})
  const startedAt = Date.now()
  const result: SweepResult = {
    schools: 0,
    units: [],
    unique: 0,
    chars: 0,
    misses: 0,
    translated: 0,
    written: 0,
    longSkipped: 0,
    errors: 0,
    exhausted: false,
  }

  const overBudget = (): boolean => {
    if (
      opts.maxTranslations !== undefined &&
      result.translated >= opts.maxTranslations
    )
      return true
    if (
      opts.deadlineMs !== undefined &&
      Date.now() - startedAt >= opts.deadlineMs
    )
      return true
    return false
  }

  const allSchools = await db.school.findMany({
    where: opts.schoolDomains ? { domain: { in: opts.schoolDomains } } : {},
    select: { id: true, domain: true },
    orderBy: { createdAt: "asc" },
  })
  const schools = allSchools.filter(
    (s) => opts.includeAllSchools || !isJunkSchool(s)
  )
  result.schools = schools.length
  if (schools.length === 0) return result

  const registryModels = Object.keys(TRANSLATABLE) as TranslatableModel[]
  const orderedModels: TranslatableModel[] = [
    ...MODEL_ORDER.filter((m) => registryModels.includes(m)),
    // Drift safety: registry models added after MODEL_ORDER was written.
    ...registryModels.filter(
      (m) => !MODEL_ORDER.includes(m) && !EXCLUDED_BY_DEFAULT.has(m)
    ),
  ]
  const models =
    opts.models ?? orderedModels.filter((m) => !EXCLUDED_BY_DEFAULT.has(m))

  // Work units in visibility order: names first (they're on every table),
  // then registered models.
  type Unit =
    | {
        kind: "names"
        model: string
        accessor: string
        fields: readonly string[]
      }
    | { kind: "model"; model: TranslatableModel }
  const units: Unit[] = [
    ...(opts.includeNames === false
      ? []
      : NAME_SOURCES.map((n) => ({ kind: "names" as const, ...n }))),
    ...models.map((m) => ({ kind: "model" as const, model: m })),
  ]

  // Same text translated once per run, even across schools.
  const globalMemo = new Map<string, string>()
  // Catalog-global rows are identical for every school — fetch once.
  const catalogCache = new Map<string, { values: string[]; rows: number }>()

  for (const school of schools) {
    for (const unit of units) {
      if (overBudget()) {
        result.exhausted = true
        return result
      }

      const label = `${school.domain}/${unit.model}`
      const isGlobal = unit.kind === "model" && CATALOG_GLOBAL.has(unit.model)
      const accessor =
        unit.kind === "names" ? unit.accessor : lowerFirst(unit.model)
      const fields =
        unit.kind === "names"
          ? unit.fields
          : (TRANSLATABLE[unit.model] as readonly string[])

      const delegate = getDelegate(accessor)
      if (!delegate) {
        log(`  [skip] db.${accessor} has no findMany — check accessor`)
        continue
      }

      let collected: { values: string[]; rows: number }
      if (isGlobal && catalogCache.has(unit.model)) {
        collected = catalogCache.get(unit.model)!
      } else {
        log(`  scanning ${label}…`)
        collected = await collectValues(
          delegate,
          isGlobal ? {} : { schoolId: school.id },
          fields,
          unit.kind === "names",
          () => result.longSkipped++,
          log,
          label
        )
        if (isGlobal) catalogCache.set(unit.model, collected)
      }

      // Dedupe by direction (script truth — same rule as the read path).
      const byDirection = new Map<string, Set<string>>()
      for (const v of collected.values) {
        const from = detectScript(v)
        const to = from === "ar" ? "en" : "ar"
        const key = `${from}>${to}`
        if (!byDirection.has(key)) byDirection.set(key, new Set())
        byDirection.get(key)!.add(v)
      }
      const unique = [...byDirection.values()].reduce((n, s) => n + s.size, 0)
      const chars = [...byDirection.values()].reduce(
        (n, s) => n + [...s].reduce((c, v) => c + v.length, 0),
        0
      )
      if (collected.rows > 0) {
        result.units.push({
          school: school.domain ?? school.id,
          model: unit.model,
          rows: collected.rows,
          unique,
          chars,
        })
        result.unique += unique
        result.chars += chars
      }

      if (!opts.translate || unique === 0) continue

      for (const [dir, set] of byDirection) {
        const [from, to] = dir.split(">") as ["ar" | "en", "ar" | "en"]
        const list = [...set]
        let pacingRetries = 0
        for (let i = 0; i < list.length; i += TRANSLATE_CHUNK) {
          if (overBudget()) {
            result.exhausted = true
            return result
          }
          const chunk = list.slice(i, i + TRANSLATE_CHUNK)
          try {
            const existing = await db.translation.findMany({
              where: {
                schoolId: school.id,
                sourceLanguage: from,
                targetLanguage: to,
                sourceText: { in: chunk },
              },
              select: { sourceText: true },
            })
            const have = new Set(existing.map((r) => r.sourceText))
            const misses = chunk.filter((v) => !have.has(v))
            if (misses.length === 0) continue
            result.misses += misses.length

            // Split into memo hits (free) and texts needing a provider call.
            const wanted = misses.filter((v) => !globalMemo.has(`${dir}|${v}`))
            if (wanted.length > 0) {
              const translations = await translateBatch(wanted, from, to, {
                retry: true,
              })
              wanted.forEach((src, j) => {
                const t = translations[j] ?? ""
                if (t.trim() !== "" && t !== src)
                  globalMemo.set(`${dir}|${src}`, t)
              })
              result.translated += wanted.length
              pacingRetries = 0
              if (opts.throttleMs) {
                await new Promise((r) => setTimeout(r, opts.throttleMs))
              }
            }

            const rows = misses
              .map((sourceText) => ({
                schoolId: school.id,
                sourceText,
                sourceLanguage: from,
                targetLanguage: to,
                translatedText: globalMemo.get(`${dir}|${sourceText}`) ?? "",
                provider: "auto",
              }))
              .filter((r) => r.translatedText !== "")
            if (rows.length > 0) {
              await db.translation.createMany({
                data: rows,
                skipDuplicates: true,
              })
              result.written += rows.length
            }
          } catch (e) {
            // Rate-limit pacing: a 429 / open-breaker failure means "too fast",
            // not "broken" — wait out the window and RETRY the same chunk
            // instead of burning the whole remaining tail on a dead circuit.
            const msg = e instanceof Error ? e.message : String(e)
            const isPacing = /rate.?limit|429|Circuit breaker is open/i.test(
              msg
            )
            if (isPacing && pacingRetries < 8) {
              pacingRetries++
              const wait = Math.min(20_000 * pacingRetries, 130_000)
              log(
                `  [pacing] ${label} ${dir} @${i}: rate-limited — waiting ${Math.round(wait / 1000)}s (retry ${pacingRetries}/8)`
              )
              await new Promise((r) => setTimeout(r, wait))
              i -= TRANSLATE_CHUNK // redo this chunk
              continue
            }
            result.errors++
            log(
              `  [batch-error] ${label} ${dir} @${i}: ${e instanceof Error ? e.message : e} — continuing`
            )
          }
        }
      }
      log(`  warmed ${label}: ${unique} unique strings`)
    }
  }

  return result
}
