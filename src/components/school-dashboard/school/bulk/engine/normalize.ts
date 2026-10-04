// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Cell → value. Every function returns `undefined` for an empty cell and
 * `null` for a value it could not read, so the planner can tell "not given"
 * from "given but wrong".
 */

const ARABIC_DIGITS = /[٠-٩۰-۹]/g

export function latinDigits(value: string): string {
  return value.replace(ARABIC_DIGITS, (d) => {
    const c = d.charCodeAt(0)
    return String(c >= 0x06f0 ? c - 0x06f0 : c - 0x0660)
  })
}

export function text(value: string | undefined): string | undefined {
  const v = value?.replace(/\s+/g, " ").trim()
  return v ? v : undefined
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function email(value: string | undefined): string | null | undefined {
  const v = text(value)?.toLowerCase()
  if (!v) return undefined
  return EMAIL_RE.test(v) ? v : null
}

export function phone(value: string | undefined): string | null | undefined {
  const raw = text(value)
  if (!raw) return undefined
  let v = latinDigits(raw).replace(/[\s\-().]/g, "")
  if (v.startsWith("00")) v = `+${v.slice(2)}`
  // Excel turns a long number into "2.49912E+11" — that is not recoverable.
  return /^\+?\d{7,15}$/.test(v) ? v : null
}

/** Accepts 2015-05-15, 2015/5/15, 15/05/2015, 15-5-2015 and Excel's
 *  formatted dates; returns YYYY-MM-DD. Day-first for slashed dates — the
 *  convention in every market we serve. */
export function date(value: string | undefined): string | null | undefined {
  const raw = text(value)
  if (!raw) return undefined
  const v = latinDigits(raw)
  let y: number, m: number, d: number
  let match = v.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (match) {
    ;[y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])]
  } else if ((match = v.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/))) {
    ;[d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])]
  } else {
    return null
  }
  const dt = new Date(Date.UTC(y, m - 1, d))
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d ||
    y < 1900 ||
    dt.getTime() > Date.now()
  )
    return null
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

const GENDER: Record<string, "male" | "female"> = {
  m: "male",
  male: "male",
  boy: "male",
  ذكر: "male",
  ولد: "male",
  f: "female",
  female: "female",
  girl: "female",
  انثى: "female",
  أنثى: "female",
  انثي: "female",
  بنت: "female",
}

export function gender(
  value: string | undefined
): "male" | "female" | null | undefined {
  const v = text(value)?.toLowerCase()
  if (!v) return undefined
  return GENDER[v] ?? null
}

export type Relation = "father" | "mother" | "guardian"

const RELATION: Record<string, Relation> = {
  father: "father",
  dad: "father",
  الأب: "father",
  الاب: "father",
  أب: "father",
  اب: "father",
  والد: "father",
  الوالد: "father",
  mother: "mother",
  mom: "mother",
  الأم: "mother",
  الام: "mother",
  أم: "mother",
  ام: "mother",
  والدة: "mother",
  الوالدة: "mother",
}

export function relation(value: string | undefined): Relation {
  const v = text(value)?.toLowerCase()
  return (v && RELATION[v]) || "guardian"
}

const EMPLOYMENT: Record<string, string> = {
  full_time: "FULL_TIME",
  "full time": "FULL_TIME",
  fulltime: "FULL_TIME",
  "دوام كامل": "FULL_TIME",
  كامل: "FULL_TIME",
  part_time: "PART_TIME",
  "part time": "PART_TIME",
  parttime: "PART_TIME",
  "دوام جزئي": "PART_TIME",
  جزئي: "PART_TIME",
  contract: "CONTRACT",
  عقد: "CONTRACT",
  temporary: "TEMPORARY",
  مؤقت: "TEMPORARY",
}

export function employmentType(
  value: string | undefined
): string | null | undefined {
  const v = text(value)?.toLowerCase()
  if (!v) return undefined
  return EMPLOYMENT[v] ?? null
}

/** Split a list cell: "Math, Physics" / "رياضيات، فيزياء" / "a; b". */
export function list(value: string | undefined): string[] {
  return (text(value) ?? "")
    .split(/[,،;|/]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Loose comparison key for names: case, Arabic letter variants, "ال". */
export function nameKey(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim()
}

// ---------------------------------------------------------------------------
// Section letters — a school writes "B", "ب" or "2"; all three mean the
// second section. Arabic sections follow abjad order (أ ب ج د ه و ز ح).
// ---------------------------------------------------------------------------

const LATIN_LETTERS = "ABCDEFGH"
const ARABIC_LETTERS = ["ا", "ب", "ج", "د", "ه", "و", "ز", "ح"]

export function letterIndex(value: string): number | null {
  const v = nameKey(latinDigits(value)).replace(/ـ/g, "")
  if (!v) return null
  if (/^[a-h]$/.test(v)) return LATIN_LETTERS.indexOf(v.toUpperCase())
  const ar = ARABIC_LETTERS.indexOf(v)
  if (ar !== -1) return ar
  if (/^[1-8]$/.test(v)) return Number(v) - 1
  return null
}

export function letterFor(index: number, script: "ar" | "en"): string {
  return script === "ar"
    ? ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح"][index]
    : LATIN_LETTERS[index]
}
