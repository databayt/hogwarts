// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"

/**
 * Server-only fetchers for the settings surfaces. Not `"use server"` — these
 * are imported by server components, so taking `schoolId` is safe here (see
 * the block CLAUDE.md note on action-vs-fetcher shapes).
 */

export async function getSubjectsWithInstructors(schoolId: string) {
  const selections = await db.subjectSelection.findMany({
    where: { schoolId, isActive: true },
    select: {
      catalogSubjectId: true,
      customName: true,
      subject: {
        select: {
          id: true,
          name: true,
          slug: true,
          department: true,
          color: true,
          thumbnail: true,
        },
      },
    },
    orderBy: { subject: { sortOrder: "asc" } },
  })

  const uniqueSubjects = new Map<
    string,
    (typeof selections)[number]["subject"] & { customName?: string | null }
  >()
  for (const s of selections) {
    if (s.subject && !uniqueSubjects.has(s.catalogSubjectId)) {
      uniqueSubjects.set(s.catalogSubjectId, {
        ...s.subject,
        customName: s.customName,
      })
    }
  }

  const subjectIds = Array.from(uniqueSubjects.keys())
  // Videos + instructor preferences both depend only on subjectIds and are
  // independent of each other — collapse two serial round-trips into one.
  const [videos, preferences] = await Promise.all([
    db.video.findMany({
      where: {
        lesson: { chapter: { subjectId: { in: subjectIds } } },
        approvalStatus: "APPROVED",
        OR: [{ schoolId }, { visibility: "PUBLIC" }],
      },
      select: {
        schoolId: true,
        isFeatured: true,
        viewCount: true,
        lesson: { select: { chapter: { select: { subjectId: true } } } },
        school: { select: { id: true, name: true } },
        user: { select: { id: true, username: true } },
      },
    }),
    db.instructorPreference.findMany({
      where: { schoolId, catalogSubjectId: { in: subjectIds } },
    }),
  ])
  const prefMap = new Map(preferences.map((p) => [p.catalogSubjectId, p]))

  type InstructorSource = {
    type: "platform" | "school" | "teacher"
    id: string | null
    name: string
    videoCount: number
    totalViews: number
  }

  const subjectInstructors = new Map<string, InstructorSource[]>()

  for (const v of videos) {
    const subjectId = v.lesson.chapter.subjectId
    const key =
      v.isFeatured && !v.schoolId
        ? "platform"
        : v.schoolId
          ? `school:${v.schoolId}`
          : `teacher:${v.user.id}`

    if (!subjectInstructors.has(subjectId)) {
      subjectInstructors.set(subjectId, [])
    }

    const sources = subjectInstructors.get(subjectId)!
    const existing = sources.find(
      (s) =>
        (s.type === "platform" && key === "platform") ||
        (s.type === "school" && s.id === v.schoolId) ||
        (s.type === "teacher" && s.id === v.user.id)
    )

    if (existing) {
      existing.videoCount++
      existing.totalViews += v.viewCount
    } else {
      sources.push({
        type:
          v.isFeatured && !v.schoolId
            ? "platform"
            : v.schoolId
              ? "school"
              : "teacher",
        id: v.schoolId ?? v.user.id,
        name:
          v.isFeatured && !v.schoolId
            ? "balqalam"
            : (v.school?.name ?? v.user.username ?? "Unknown"),
        videoCount: 1,
        totalViews: v.viewCount,
      })
    }
  }

  return Array.from(uniqueSubjects.entries()).map(([id, subject]) => ({
    id,
    name:
      (subject as { customName?: string | null }).customName || subject.name,
    slug: subject.slug,
    department: subject.department,
    color: subject.color,
    instructors: (subjectInstructors.get(id) ?? []).sort(
      (a, b) => b.videoCount - a.videoCount
    ),
    currentPreference: prefMap.get(id) ?? null,
  }))
}
