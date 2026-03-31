// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { StreamSettingsContent } from "@/components/stream/settings/content"
import { getSchoolEnrollments } from "@/components/stream/settings/enrollments/actions"
import { EnrollmentsContent } from "@/components/stream/settings/enrollments/content"
import { InstructorSettingsContent } from "@/components/stream/settings/instructor-settings"
import { StreamAdminDashboardContent } from "@/components/stream/settings/overview"
import { getMyVideos } from "@/components/stream/teach/actions"
import { TeachVideosContent } from "@/components/stream/teach/videos-content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

async function getSubjectsWithInstructors(schoolId: string) {
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
  const videos = await db.video.findMany({
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

  const preferences = await db.instructorPreference.findMany({
    where: { schoolId, catalogSubjectId: { in: subjectIds } },
  })
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

export default async function StreamSettingsPage({
  params,
  searchParams,
}: Props) {
  const { lang, subdomain } = await params
  const resolvedSearchParams = await searchParams
  const activeTab =
    typeof resolvedSearchParams.tab === "string"
      ? resolvedSearchParams.tab
      : "overview"

  const [dictionary, { schoolId }, session] = await Promise.all([
    getDictionary(lang),
    getTenantContext(),
    auth(),
  ])

  if (!session?.user) {
    redirect(`/${lang}/auth/login`)
  }

  const role = session.user.role || ""
  const isAdmin = ["ADMIN", "DEVELOPER"].includes(role)
  const isTeacher = role === "TEACHER"

  if (!isAdmin && !isTeacher) {
    redirect(`/${lang}/stream/courses`)
  }

  // Fetch overview stats for admin
  async function getOverviewStats(sid: string) {
    const [totalSubjects, totalEnrollments, totalVideos] = await Promise.all([
      db.subjectSelection.count({
        where: { schoolId: sid, isActive: true },
      }),
      db.enrollment.count({
        where: { isActive: true, OR: [{ schoolId: sid }, { schoolId: null }] },
      }),
      db.video.count({ where: { schoolId: sid } }),
    ])
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const [thisMonth, lastMonth] = await Promise.all([
      db.enrollment.count({
        where: {
          isActive: true,
          OR: [{ schoolId: sid }, { schoolId: null }],
          createdAt: { gte: thisMonthStart },
        },
      }),
      db.enrollment.count({
        where: {
          isActive: true,
          OR: [{ schoolId: sid }, { schoolId: null }],
          createdAt: { gte: lastMonthStart, lt: thisMonthStart },
        },
      }),
    ])
    const growthPercent =
      lastMonth > 0
        ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
        : thisMonth > 0
          ? 100
          : 0

    return {
      totalCourses: totalSubjects,
      totalEnrollments,
      totalRevenue: 0,
      growthPercent,
      recentCourses: [] as any[],
    }
  }

  // Fetch data based on role
  const [enrollments, subjects, videos, overviewStats] = await Promise.all([
    isAdmin ? getSchoolEnrollments() : Promise.resolve([]),
    isAdmin && schoolId
      ? getSubjectsWithInstructors(schoolId)
      : Promise.resolve([]),
    getMyVideos(),
    isAdmin && schoolId ? getOverviewStats(schoolId) : Promise.resolve(null),
  ])

  return (
    <StreamSettingsContent
      activeTab={activeTab}
      userRole={role}
      dictionary={dictionary.stream || {}}
      overviewContent={
        <StreamAdminDashboardContent
          dictionary={dictionary}
          lang={lang}
          schoolId={schoolId}
          userId={session.user.id}
          userRole={role}
          stats={overviewStats}
        />
      }
      enrollmentsContent={
        <EnrollmentsContent
          dictionary={dictionary.stream || {}}
          lang={lang}
          enrollments={enrollments}
        />
      }
      instructorsContent={
        <InstructorSettingsContent
          dictionary={dictionary}
          lang={lang}
          subjects={subjects}
        />
      }
      videosContent={
        <TeachVideosContent
          dictionary={dictionary.stream || {}}
          lang={lang}
          videos={videos}
          subdomain={subdomain}
        />
      }
    />
  )
}
