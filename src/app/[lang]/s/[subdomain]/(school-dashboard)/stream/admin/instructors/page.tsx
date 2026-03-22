// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { InstructorSettingsContent } from "@/components/stream/admin/instructor-settings"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

async function getSubjectsWithInstructors(schoolId: string) {
  // Get all selected subjects for this school
  const selections = await db.schoolSubjectSelection.findMany({
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
          imageKey: true,
          thumbnailKey: true,
        },
      },
    },
    orderBy: { subject: { sortOrder: "asc" } },
  })

  // Deduplicate subjects (a subject may appear for multiple grades)
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

  // Get video counts grouped by source for each subject
  const subjectIds = Array.from(uniqueSubjects.keys())
  const videos = await db.lessonVideo.findMany({
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
  })

  // Get current preferences
  const preferences = await db.schoolInstructorPreference.findMany({
    where: { schoolId, catalogSubjectId: { in: subjectIds } },
  })
  const prefMap = new Map(preferences.map((p) => [p.catalogSubjectId, p]))

  // Group videos by subject and source
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
            ? "Hogwarts"
            : (v.school?.name ?? v.user.username ?? "Unknown"),
        videoCount: 1,
        totalViews: v.viewCount,
      })
    }
  }

  return Array.from(uniqueSubjects.entries()).map(([id, subject]) => ({
    id,
    name: (subject as any).customName || subject.name,
    slug: subject.slug,
    department: subject.department,
    color: subject.color,
    instructors: (subjectInstructors.get(id) ?? []).sort(
      (a, b) => b.videoCount - a.videoCount
    ),
    currentPreference: prefMap.get(id) ?? null,
  }))
}

export default async function InstructorSettingsPage({ params }: Props) {
  const { lang } = await params
  const [dictionary, { schoolId }, session] = await Promise.all([
    getDictionary(lang),
    getTenantContext(),
    auth(),
  ])

  if (!session?.user) {
    redirect(`/${lang}/auth/login`)
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "DEVELOPER") {
    redirect(`/${lang}/stream/not-admin`)
  }

  const subjects = schoolId ? await getSubjectsWithInstructors(schoolId) : []

  return (
    <InstructorSettingsContent
      dictionary={dictionary}
      lang={lang}
      subjects={subjects}
    />
  )
}
