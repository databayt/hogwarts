// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { StreamDashboardContent } from "@/components/stream/dashboard/content"
import { getChildrenProgress } from "@/components/stream/dashboard/parent/actions"
import { ParentProgressContent } from "@/components/stream/dashboard/parent/content"
import { getCatalogDashboardData } from "@/components/stream/data/catalog/get-dashboard-data"
import { StreamAdminDashboardContent } from "@/components/stream/settings/overview"
import { getTeacherStats } from "@/components/stream/teach/actions"
import { getProposableLessons } from "@/components/stream/teach/get-proposable-lessons"
import { TeachOverviewContent } from "@/components/stream/teach/overview-content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary.stream?.dashboard?.title || "My Learning Dashboard",
    description:
      dictionary.stream?.dashboard?.description ||
      "Track your learning progress",
  }
}

async function getCatalogAdminStats(schoolId: string) {
  const [totalSubjects, totalEnrollments, totalVideos, recentEnrollments] =
    await Promise.all([
      db.subjectSelection.count({
        where: { schoolId, isActive: true },
      }),
      db.enrollment.count({
        where: {
          isActive: true,
          OR: [{ schoolId }, { schoolId: null }],
        },
      }),
      db.video.count({
        where: { schoolId },
      }),
      (async () => {
        const now = new Date()
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastMonthStart = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        )

        const [thisMonth, lastMonth] = await Promise.all([
          db.enrollment.count({
            where: {
              isActive: true,
              OR: [{ schoolId }, { schoolId: null }],
              createdAt: { gte: thisMonthStart },
            },
          }),
          db.enrollment.count({
            where: {
              isActive: true,
              OR: [{ schoolId }, { schoolId: null }],
              createdAt: { gte: lastMonthStart, lt: thisMonthStart },
            },
          }),
        ])

        let growthPercent = 0
        if (lastMonth > 0) {
          growthPercent = Math.round(
            ((thisMonth - lastMonth) / lastMonth) * 100
          )
        } else if (thisMonth > 0) {
          growthPercent = 100
        }

        return { growthPercent }
      })(),
    ])

  const recentSubjectSelections = await db.subjectSelection.findMany({
    where: { schoolId, isActive: true },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          totalChapters: true,
          totalLessons: true,
          createdAt: true,
        },
      },
    },
  })

  const subjectIds = recentSubjectSelections
    .map((s) => s.catalogSubjectId)
    .filter(Boolean) as string[]

  const enrollmentCounts =
    subjectIds.length > 0
      ? await db.enrollment.groupBy({
          by: ["catalogSubjectId"],
          where: {
            catalogSubjectId: { in: subjectIds },
            isActive: true,
          },
          _count: true,
        })
      : []

  const enrollmentCountMap = new Map(
    enrollmentCounts.map((e) => [e.catalogSubjectId, e._count])
  )

  const recentCourses = recentSubjectSelections
    .filter((s) => s.subject)
    .map((s) => ({
      id: s.subject!.id,
      title: s.subject!.name,
      slug: s.subject!.slug,
      isPublished: s.subject!.status === "PUBLISHED",
      createdAt: s.subject!.createdAt,
      chapters: Array.from({ length: s.subject!.totalChapters }, () => ({
        lessons: Array.from(
          {
            length: Math.ceil(
              s.subject!.totalLessons / Math.max(s.subject!.totalChapters, 1)
            ),
          },
          () => ({ id: "" })
        ),
      })),
      _count: {
        enrollments: enrollmentCountMap.get(s.catalogSubjectId) || 0,
      },
    }))

  return {
    totalCourses: totalSubjects,
    totalEnrollments,
    totalRevenue: 0,
    growthPercent: recentEnrollments.growthPercent,
    recentCourses,
  }
}

export default async function StreamDashboardPage({ params }: Props) {
  const { lang, subdomain } = await params
  const [dictionary, { schoolId }, session] = await Promise.all([
    getDictionary(lang),
    getTenantContext(),
    auth(),
  ])

  if (!session?.user) {
    redirect(`/${lang}/auth/login`)
  }

  const role = session.user.role || ""

  // Guardian: show children's progress
  if (role === "GUARDIAN") {
    const childrenProgress = await getChildrenProgress()
    return (
      <ParentProgressContent
        dictionary={dictionary.stream || {}}
        lang={lang}
        childrenProgress={childrenProgress}
      />
    )
  }

  // Admin/Developer: show admin stats + enrolled courses
  if (role === "ADMIN" || role === "DEVELOPER") {
    const [stats, dashboardData] = await Promise.all([
      schoolId ? getCatalogAdminStats(schoolId) : null,
      schoolId
        ? getCatalogDashboardData(session.user.id, schoolId)
        : { enrolledCourses: [], availableCourses: [] },
    ])

    return (
      <div className="space-y-12">
        <StreamAdminDashboardContent
          dictionary={dictionary}
          lang={lang}
          schoolId={schoolId}
          userId={session.user.id}
          userRole={role}
          stats={stats}
        />
        {dashboardData.enrolledCourses.length > 0 && (
          <StreamDashboardContent
            dictionary={dictionary.stream}
            lang={lang}
            schoolId={schoolId}
            userId={session.user.id}
            enrolledCourses={dashboardData.enrolledCourses}
            availableCourses={[]}
          />
        )}
      </div>
    )
  }

  // Teacher: show teacher stats + enrolled courses
  if (role === "TEACHER") {
    const [teacherStats, dashboardData, proposableLessons] = await Promise.all([
      getTeacherStats(),
      schoolId
        ? getCatalogDashboardData(session.user.id, schoolId)
        : { enrolledCourses: [], availableCourses: [] },
      getProposableLessons(),
    ])

    return (
      <div className="space-y-12">
        <TeachOverviewContent
          dictionary={dictionary.stream || {}}
          lang={lang}
          stats={teacherStats}
          subdomain={subdomain}
          proposableLessons={proposableLessons}
        />
        {dashboardData.enrolledCourses.length > 0 && (
          <StreamDashboardContent
            dictionary={dictionary.stream}
            lang={lang}
            schoolId={schoolId}
            userId={session.user.id}
            enrolledCourses={dashboardData.enrolledCourses}
            availableCourses={[]}
          />
        )}
      </div>
    )
  }

  // Student / other roles: show learning dashboard
  const dashboardData = schoolId
    ? await getCatalogDashboardData(session.user.id, schoolId)
    : { enrolledCourses: [], availableCourses: [] }

  return (
    <StreamDashboardContent
      dictionary={dictionary.stream}
      lang={lang}
      schoolId={schoolId}
      userId={session.user.id}
      enrolledCourses={dashboardData.enrolledCourses}
      availableCourses={dashboardData.availableCourses}
    />
  )
}
