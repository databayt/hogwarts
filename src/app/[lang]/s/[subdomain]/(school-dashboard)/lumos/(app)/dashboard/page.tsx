// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import type { Role } from "@/lib/rbac/types"
import { isRoleIn } from "@/lib/rbac/ui-permissions"
import { getTenantContext } from "@/lib/tenant-context"
import { getCatalogImageUrl } from "@/components/catalog/image-url"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { LumosDashboardContent } from "@/components/lumos/dashboard/content"
import { getChildrenProgress } from "@/components/lumos/dashboard/parent/actions"
import { ParentProgressContent } from "@/components/lumos/dashboard/parent/content"
import { getCatalogDashboardData } from "@/components/lumos/data/catalog/get-dashboard-data"
import { LUMOS_ADMIN_ROLES } from "@/components/lumos/permissions"
import { LumosAdminDashboardContent } from "@/components/lumos/settings/overview"
import { getTeacherStats } from "@/components/lumos/teach/actions"
import { getProposableCatalog } from "@/components/lumos/teach/get-proposable-lessons"
import { TeachOverviewContent } from "@/components/lumos/teach/overview-content"
import { getSchoolCurrency } from "@/components/lumos/teach/school-currency"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary.lumos?.dashboard?.title || "My Learning Dashboard",
    description:
      dictionary.lumos?.dashboard?.description ||
      "Track your learning progress",
  }
}

async function getCatalogAdminStats(schoolId: string) {
  const [
    totalSubjects,
    totalEnrollments,
    totalVideos,
    recentEnrollments,
    recentSubjectSelections,
  ] = await Promise.all([
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
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

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
        growthPercent = Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
      } else if (thisMonth > 0) {
        growthPercent = 100
      }

      return { growthPercent }
    })(),
    // Independent of the four counts above (keys only on schoolId).
    db.subjectSelection.findMany({
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
            thumbnail: true,
            color: true,
            totalChapters: true,
            totalLessons: true,
            createdAt: true,
          },
        },
      },
    }),
  ])

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
      imageUrl: getCatalogImageUrl(s.subject!.thumbnail, "original"),
      color: s.subject!.color,
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

export default async function LumosDashboardPage({ params }: Props) {
  const { lang, subdomain } = await params
  const [dictionary, { schoolId }, session] = await Promise.all([
    getDictionary(lang),
    getTenantContext(),
    auth(),
  ])

  if (!session?.user) {
    redirect(`/${lang}/auth/login`)
  }

  const role = (session.user.role || null) as Role | null

  // Guardian: show children's progress
  if (role === "GUARDIAN") {
    const childrenProgress = await getChildrenProgress()
    return (
      <ParentProgressContent
        dictionary={dictionary.lumos || {}}
        lang={lang}
        childrenProgress={childrenProgress}
      />
    )
  }

  // Admin/Developer: show admin stats + enrolled courses
  if (isRoleIn(role, LUMOS_ADMIN_ROLES)) {
    const [stats, dashboardData] = await Promise.all([
      schoolId ? getCatalogAdminStats(schoolId) : null,
      schoolId
        ? getCatalogDashboardData(session.user.id, schoolId)
        : { enrolledCourses: [], availableCourses: [] },
    ])

    return (
      <div className="space-y-12">
        <LumosAdminDashboardContent
          dictionary={dictionary}
          lang={lang}
          schoolId={schoolId}
          userId={session.user.id}
          userRole={role ?? ""}
          stats={stats}
        />
        {dashboardData.enrolledCourses.length > 0 && (
          <LumosDashboardContent
            dictionary={dictionary.lumos}
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
    const [teacherStats, dashboardData, proposableGrades, currency] =
      await Promise.all([
        getTeacherStats(),
        schoolId
          ? getCatalogDashboardData(session.user.id, schoolId)
          : { enrolledCourses: [], availableCourses: [] },
        getProposableCatalog(lang),
        getSchoolCurrency(),
      ])

    return (
      <div className="space-y-12">
        <TeachOverviewContent
          dictionary={dictionary.lumos || {}}
          lang={lang}
          stats={teacherStats}
          subdomain={subdomain}
          proposableGrades={proposableGrades}
          currency={currency}
        />
        {dashboardData.enrolledCourses.length > 0 && (
          <LumosDashboardContent
            dictionary={dictionary.lumos}
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
    <LumosDashboardContent
      dictionary={dictionary.lumos}
      lang={lang}
      schoolId={schoolId}
      userId={session.user.id}
      enrolledCourses={dashboardData.enrolledCourses}
      availableCourses={dashboardData.availableCourses}
    />
  )
}
