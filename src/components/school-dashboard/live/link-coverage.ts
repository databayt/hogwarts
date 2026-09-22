// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Server-only read, NOT a "use server" action: it takes the school as an
// argument, so it must only ever be called with one the caller has already
// authorised — the settings action (manage_settings) or the mobile landing
// route (ADMIN/DEVELOPER from a verified token).
import "server-only"

import { db } from "@/lib/db"
import { resolveActiveTerm } from "@/lib/term-resolver"

import { ONLINE_POLICY_SELECT } from "./online-policy"

/**
 * Which timetabled (section, subject) pairs have a meeting link of their own —
 * the body of `getLiveLinkCoverage`, moved here so the phone's readiness band
 * reads the same numbers as the web's.
 */
export async function computeLiveLinkCoverage(schoolId: string) {
  const [school, { term }] = await Promise.all([
    db.school.findUnique({
      where: { id: schoolId },
      select: { ...ONLINE_POLICY_SELECT, conferenceFallbackUrl: true },
    }),
    resolveActiveTerm(schoolId),
  ])
  if (!term) {
    return {
      success: true as const,
      data: {
        total: 0,
        covered: 0,
        gaps: [] as Array<{ section: string; subject: string }>,
        gapCount: 0,
        hasFallback: Boolean(school?.conferenceFallbackUrl),
        truncated: false,
      },
    }
  }

  const [slots, links] = await Promise.all([
    db.timetable.findMany({
      where: {
        schoolId: schoolId,
        termId: term.id,
        weekOffset: 0,
        sectionId: { not: null },
        subjectId: { not: null },
        teacherId: { not: null },
        period: { isBreak: false },
      },
      select: {
        sectionId: true,
        subjectId: true,
        section: { select: { name: true } },
        subject: { select: { name: true } },
      },
      // A week of slots for a large school. Enough to enumerate every distinct
      // pair; flagged rather than silently truncated if a tenant exceeds it.
      take: 2001,
    }),
    db.conferenceLink.findMany({
      where: { schoolId: schoolId, termId: term.id },
      select: { sectionId: true, subjectId: true },
    }),
  ])

  const truncated = slots.length > 2000
  const linked = new Set(links.map((l) => `${l.sectionId}:${l.subjectId}`))

  const pairs = new Map<
    string,
    { sectionId: string; subjectId: string; section: string; subject: string }
  >()
  for (const s of slots.slice(0, 2000)) {
    if (!s.sectionId || !s.subjectId) continue
    const key = `${s.sectionId}:${s.subjectId}`
    if (pairs.has(key)) continue
    pairs.set(key, {
      sectionId: s.sectionId,
      subjectId: s.subjectId,
      section: s.section?.name ?? "",
      subject: s.subject?.name ?? "",
    })
  }

  const gaps = [...pairs.entries()]
    .filter(([key]) => !linked.has(key))
    .map(([, v]) => v)
    .sort(
      (a, b) =>
        a.section.localeCompare(b.section) || a.subject.localeCompare(b.subject)
    )

  return {
    success: true as const,
    data: {
      total: pairs.size,
      covered: pairs.size - gaps.length,
      // Bounded: the panel names the first gaps and counts the rest, so a
      // school with 400 uncovered pairs doesn't ship 400 rows to the client.
      gaps: gaps.slice(0, 50),
      gapCount: gaps.length,
      // With a fallback set, an uncovered pair is still joinable (on a SHARED
      // room). Without one, it materializes nothing at all.
      hasFallback: Boolean(school?.conferenceFallbackUrl),
      truncated,
    },
  }
}
