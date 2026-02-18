import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { StreamAdminDashboardContent } from "@/components/stream/admin/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary.stream?.admin?.title || "Stream Admin Dashboard",
    description:
      dictionary.stream?.admin?.description ||
      "Manage courses and track enrollments",
  }
}

async function getCatalogAdminStats(schoolId: string) {
  const [totalSubjects, totalEnrollments, totalVideos, recentEnrollments] =
    await Promise.all([
      // Adopted catalog subjects
      db.schoolSubjectSelection.count({
        where: { schoolId, isActive: true },
      }),
      // Active enrollments
      db.enrollment.count({
        where: {
          isActive: true,
          OR: [{ schoolId }, { schoolId: null }],
        },
      }),
      // Videos uploaded by this school
      db.lessonVideo.count({
        where: { schoolId },
      }),
      // Recent enrollments for growth calculation
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

  // Get recently adopted subjects for the list
  const recentSubjectSelections = await db.schoolSubjectSelection.findMany({
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

  // Get enrollment counts per subject
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

export default async function StreamAdminDashboardPage({ params }: Props) {
  const { lang, subdomain } = await params
  const [dictionary, { schoolId }, session] = await Promise.all([
    getDictionary(lang),
    getTenantContext(),
    auth(),
  ])

  if (!session?.user) {
    redirect(`/${lang}/s/${subdomain}/auth/login`)
  }

  if (
    session.user.role !== "ADMIN" &&
    session.user.role !== "TEACHER" &&
    session.user.role !== "DEVELOPER"
  ) {
    redirect(`/${lang}/s/${subdomain}/stream/not-admin`)
  }

  const stats = schoolId ? await getCatalogAdminStats(schoolId) : null

  return (
    <StreamAdminDashboardContent
      dictionary={dictionary.stream}
      lang={lang}
      schoolId={schoolId}
      userId={session.user.id}
      userRole={session.user.role}
      stats={stats}
    />
  )
}
