"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Recurring-link carry-forward. ConferenceLink rows are keyed per-term, so a
// set-once weekly meeting link silently disappears at term rollover. This
// clones every link from one term into the next. Idempotent: skips
// (subject, section) pairs that already have a link in the target term.

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"

import { requireContext } from "./helpers"

export async function carryForwardConferenceLinks(
  fromTermId: string,
  toTermId: string
) {
  const ctx = await requireContext("manage_settings")
  if (!ctx.ok) return ctx.response
  if (!fromTermId || !toTermId || fromTermId === toTermId) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR)
  }

  const [source, existing] = await Promise.all([
    db.conferenceLink.findMany({
      where: { schoolId: ctx.schoolId, termId: fromTermId },
    }),
    db.conferenceLink.findMany({
      where: { schoolId: ctx.schoolId, termId: toTermId },
      select: { subjectId: true, sectionId: true },
    }),
  ])

  const seen = new Set(existing.map((e) => `${e.subjectId}:${e.sectionId}`))
  let created = 0

  for (const link of source) {
    if (seen.has(`${link.subjectId}:${link.sectionId}`)) continue
    try {
      await db.conferenceLink.create({
        data: {
          schoolId: ctx.schoolId,
          subjectId: link.subjectId,
          sectionId: link.sectionId,
          termId: toTermId,
          provider: link.provider,
          meetingUrl: link.meetingUrl,
          meetingProvider: link.meetingProvider,
          createdBy: ctx.userId,
        },
      })
      created++
    } catch {
      // Unique-constraint race (a link appeared concurrently) — skip, stay idempotent.
    }
  }

  return { success: true as const, data: { created, skipped: source.length - created } }
}

/**
 * List the school's terms (most recent first) for the carry-forward picker.
 * ADMIN/DEVELOPER only (same `manage_settings` gate as the action above).
 */
export async function listConferenceTerms() {
  const ctx = await requireContext("manage_settings")
  if (!ctx.ok) return ctx.response
  const terms = await db.term.findMany({
    where: { schoolId: ctx.schoolId },
    orderBy: { startDate: "desc" },
    select: { id: true, termNumber: true, startDate: true, isActive: true },
    take: 24,
  })
  return { success: true as const, data: terms }
}
