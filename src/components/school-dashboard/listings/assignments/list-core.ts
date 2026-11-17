// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The management list's row — one shape for the page's first render and the
 * "load more" action, so the two can't drift. Selects only what a row shows
 * (the list used to read every column), and never lets a URL parameter reach
 * Prisma unchecked: an unknown `type` or sort id used to throw.
 */

import type { Prisma } from "@prisma/client"

import { audienceLabel } from "@/lib/teaching-audience"

import { ASSIGNMENT_TYPES } from "./labels"

export type AssignmentRow = {
  id: string
  title: string
  type: string
  status: string
  totalPoints: number
  dueDate: string
  createdAt: string
  /** Section, else grade. */
  className: string
  subjectName: string | null
}

export const assignmentRowSelect = {
  id: true,
  title: true,
  type: true,
  status: true,
  totalPoints: true,
  dueDate: true,
  createdAt: true,
  section: { select: { name: true } },
  grade: { select: { name: true } },
  subject: { select: { name: true } },
} satisfies Prisma.SchoolAssignmentSelect

type RowSource = Prisma.SchoolAssignmentGetPayload<{
  select: typeof assignmentRowSelect
}>

export function toAssignmentRow(a: RowSource): AssignmentRow {
  return {
    id: a.id,
    title: a.title,
    type: a.type,
    status: a.status,
    // Prisma Decimal → number: a Decimal cannot cross to a client component.
    totalPoints: Number(a.totalPoints),
    dueDate: a.dueDate.toISOString(),
    createdAt: a.createdAt.toISOString(),
    className: audienceLabel(a),
    subjectName: a.subject?.name ?? null,
  }
}

const SORTABLE = new Set([
  "title",
  "type",
  "status",
  "totalPoints",
  "dueDate",
  "createdAt",
])

/** The `type` filter, or undefined when it is not an AssessmentType. */
export function safeTypeFilter(type: string | undefined) {
  return type && (ASSIGNMENT_TYPES as readonly string[]).includes(type)
    ? (type as (typeof ASSIGNMENT_TYPES)[number])
    : undefined
}

export function safeOrderBy(
  sort: ReadonlyArray<{ id: string; desc?: boolean }> | undefined
): Prisma.SchoolAssignmentOrderByWithRelationInput[] {
  const valid = (sort ?? []).filter((s) => SORTABLE.has(s.id))
  return valid.length
    ? valid.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
    : [{ createdAt: "desc" }]
}
