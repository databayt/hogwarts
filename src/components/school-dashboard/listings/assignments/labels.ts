// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Dictionary lookups for the enums every assignments surface shows. The
 * dictionary keys are camelCase (`finalExam`, `inProgress`); the enums are
 * SCREAMING_SNAKE (`FINAL_EXAM`, `IN_PROGRESS`).
 */

type Text = Record<string, string | undefined> | undefined

export function enumKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}

export const ASSIGNMENT_TYPES = [
  "HOMEWORK",
  "QUIZ",
  "TEST",
  "MIDTERM",
  "FINAL_EXAM",
  "PROJECT",
  "LAB_REPORT",
  "ESSAY",
  "PRESENTATION",
] as const

export function typeLabel(types: Text, type: string): string {
  return types?.[enumKey(type)] ?? type
}

export function statusLabel(statuses: Text, status: string): string {
  return statuses?.[enumKey(status)] ?? status
}

export type BadgeTone = "default" | "secondary" | "outline" | "destructive"

export function statusVariant(status: string): BadgeTone {
  switch (status) {
    case "PUBLISHED":
    case "IN_PROGRESS":
    case "ACTIVE":
      return "default"
    case "COMPLETED":
    case "GRADED":
      return "secondary"
    default:
      return "outline"
  }
}
