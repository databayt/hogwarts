/**
 * The files the wave loop reads and writes — one place, so there is one
 * author per format.
 *
 *   scripts/funnel/templates/variants.json   the variant registry (tracked:
 *                                            it holds only our own copy)
 *   scripts/crm/.data/waves/<wave>.json      one ledger per wave (GITIGNORED:
 *                                            school contacts + reply texts,
 *                                            and this repo is public)
 *   scripts/crm/.data/funnel-loop/           loop state (last inbox read, …)
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs"
import { join } from "node:path"

import type {
  LedgerEvent,
  LedgerRow,
  Variant,
  WaveLedger,
} from "@/lib/funnel/waves"

const ROOT = process.cwd()
export const VARIANTS_FILE = join(
  ROOT,
  "scripts/funnel/templates/variants.json"
)
export const WAVES_DIR = join(ROOT, "scripts/crm/.data/waves")
export const STATE_DIR = join(ROOT, "scripts/crm/.data/funnel-loop")

export function loadVariants(): Variant[] {
  return (
    JSON.parse(readFileSync(VARIANTS_FILE, "utf8")) as { variants: Variant[] }
  ).variants
}

export function saveVariants(variants: Variant[]): void {
  const doc = JSON.parse(readFileSync(VARIANTS_FILE, "utf8")) as Record<
    string,
    unknown
  >
  writeFileSync(
    VARIANTS_FILE,
    JSON.stringify({ ...doc, variants }, null, 2) + "\n"
  )
}

const waveFile = (wave: string) => {
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(wave))
    throw new Error(`bad wave id "${wave}" — use e.g. w1, w2, e2e-0928`)
  return join(WAVES_DIR, `${wave}.json`)
}

export function loadLedger(wave: string): WaveLedger {
  const f = waveFile(wave)
  if (!existsSync(f))
    return { wave, createdAt: new Date().toISOString(), rows: [] }
  return JSON.parse(readFileSync(f, "utf8")) as WaveLedger
}

export function saveLedger(l: WaveLedger): string {
  mkdirSync(WAVES_DIR, { recursive: true })
  const f = waveFile(l.wave)
  writeFileSync(f, JSON.stringify(l, null, 2) + "\n")
  return f
}

export function loadAllLedgers(): WaveLedger[] {
  if (!existsSync(WAVES_DIR)) return []
  return readdirSync(WAVES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(WAVES_DIR, f), "utf8")))
}

/** Add rows to a wave, replacing any earlier row for the same school. */
export function appendRows(wave: string, rows: LedgerRow[]): string {
  const l = loadLedger(wave)
  const ids = new Set(rows.map((r) => r.companyId))
  l.rows = [...l.rows.filter((r) => !ids.has(r.companyId)), ...rows]
  return saveLedger(l)
}

/** Record an outcome once — the same (kind) is never stamped twice on a row. */
export function addEvent(
  wave: string,
  companyId: string,
  ev: LedgerEvent
): boolean {
  const l = loadLedger(wave)
  const row = l.rows.find((r) => r.companyId === companyId)
  if (!row || row.events.some((e) => e.kind === ev.kind)) return false
  row.events.push(ev)
  saveLedger(l)
  return true
}

export function readState<T>(name: string, fallback: T): T {
  const f = join(STATE_DIR, `${name}.json`)
  return existsSync(f) ? (JSON.parse(readFileSync(f, "utf8")) as T) : fallback
}

export function writeState(name: string, value: unknown): void {
  mkdirSync(STATE_DIR, { recursive: true })
  writeFileSync(join(STATE_DIR, `${name}.json`), JSON.stringify(value, null, 2))
}
