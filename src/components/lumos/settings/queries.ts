// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import {
  getInstructorPolicy,
  instructorKeyOf,
  videoVisibilityWhere,
  type InstructorKey,
} from "@/components/lumos/lib/instructor-policy"

/**
 * Server-only fetchers for the settings surfaces. Not `"use server"` — these
 * are imported by server components, so taking `schoolId` is safe here (see
 * the block CLAUDE.md note on action-vs-fetcher shapes).
 */

export interface InstructorRosterRow {
  /** "platform" | "teacher:<userId>" — see `lib/instructor-policy`. */
  key: InstructorKey
  name: string | null
  image: string | null
  /** Null for the platform row and for unaffiliated contributors. */
  schoolName: string | null
  isOwnSchool: boolean
  isPlatform: boolean
  subjectCount: number
  /** Distinct lessons this instructor covers — the lock's coverage figure. */
  lessonCount: number
  videoCount: number
  isBlocked: boolean
  isDefault: boolean
  isLocked: boolean
}

export interface InstructorRoster {
  rows: InstructorRosterRow[]
  /**
   * Every lesson a student can reach across the school's adopted subjects —
   * the coverage denominator. Excludes chapters and lessons the school hid,
   * so it agrees with the totals the lesson pages and certificates use.
   */
  totalLessons: number
  ownSchool: { id: string; name: string | null } | null
  lockedKey: InstructorKey | null
  defaultKey: InstructorKey | null
}

/**
 * Every instructor whose videos reach this school's curriculum, as people —
 * one row per contributor plus the single branded platform row — with the
 * governance state the roster edits.
 *
 * "The same curriculum" is the school's active `SubjectSelection` set; there
 * is no separate curriculum join to make.
 */
export async function getInstructorRoster(
  schoolId: string
): Promise<InstructorRoster> {
  const selections = await db.subjectSelection.findMany({
    where: { schoolId, isActive: true },
    select: { catalogSubjectId: true },
  })

  const subjectIds = Array.from(
    new Set(selections.map((s) => s.catalogSubjectId))
  )

  const policy = await getInstructorPolicy(schoolId)

  if (subjectIds.length === 0) {
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true },
    })
    return {
      rows: [],
      totalLessons: 0,
      ownSchool: school ?? null,
      lockedKey: policy.lockedKey,
      defaultKey: policy.defaultKey,
    }
  }

  // The hidden-content predicate the student-facing paths apply. Repeated on
  // both the video join and the denominator so a coverage figure like
  // "41 of 58" counts the same lessons a student can actually open.
  const visibleLesson = {
    chapter: {
      subjectId: { in: subjectIds },
      NOT: { overrides: { some: { schoolId, isHidden: true } } },
    },
    status: "PUBLISHED" as const,
    NOT: { overrides: { some: { schoolId, isHidden: true } } },
  }

  const [videos, totalLessons, school] = await Promise.all([
    db.video.findMany({
      where: {
        lesson: visibleLesson,
        approvalStatus: "APPROVED",
        // Shared with the lesson path. The old `OR: [{schoolId}, PUBLIC]` here
        // omitted PAID, so partner instructors students could actually see and
        // buy from never appeared in this roster.
        ...videoVisibilityWhere(schoolId, null),
        NOT: { overrides: { some: { schoolId, isHidden: true } } },
      },
      select: {
        catalogLessonId: true,
        schoolId: true,
        isFeatured: true,
        viewCount: true,
        lesson: { select: { chapter: { select: { subjectId: true } } } },
        school: { select: { id: true, name: true } },
        user: { select: { id: true, username: true, image: true } },
      },
    }),
    db.lesson.count({ where: visibleLesson }),
    db.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true },
    }),
  ])

  const accumulator = new Map<
    InstructorKey,
    {
      row: Omit<InstructorRosterRow, "subjectCount" | "lessonCount">
      subjects: Set<string>
      lessons: Set<string>
    }
  >()

  for (const v of videos) {
    const key = instructorKeyOf(v)
    const isPlatform = key === "platform"

    let entry = accumulator.get(key)
    if (!entry) {
      entry = {
        row: {
          key,
          // The platform row is branded, never a username — the UI supplies
          // the localized brand name for it.
          name: isPlatform ? null : (v.user.username ?? v.school?.name ?? null),
          image: isPlatform ? null : v.user.image,
          schoolName: isPlatform ? null : (v.school?.name ?? null),
          isOwnSchool: v.schoolId === schoolId,
          isPlatform,
          videoCount: 0,
          isBlocked:
            policy.blocked.has(key) ||
            (v.schoolId ? policy.blocked.has(`school:${v.schoolId}`) : false),
          isDefault: policy.defaultKey === key,
          isLocked: policy.lockedKey === key,
        },
        subjects: new Set<string>(),
        lessons: new Set<string>(),
      }
      accumulator.set(key, entry)
    }

    entry.row.videoCount++
    entry.subjects.add(v.lesson.chapter.subjectId)
    entry.lessons.add(v.catalogLessonId)
  }

  const rows = Array.from(accumulator.values())
    .map(({ row, subjects, lessons }) => ({
      ...row,
      subjectCount: subjects.size,
      lessonCount: lessons.size,
    }))
    // Platform first, then by how much of the curriculum each one covers.
    .sort(
      (a, b) =>
        Number(b.isPlatform) - Number(a.isPlatform) ||
        b.lessonCount - a.lessonCount ||
        b.videoCount - a.videoCount
    )

  return {
    rows,
    totalLessons,
    ownSchool: school ?? null,
    lockedKey: policy.lockedKey,
    defaultKey: policy.defaultKey,
  }
}
