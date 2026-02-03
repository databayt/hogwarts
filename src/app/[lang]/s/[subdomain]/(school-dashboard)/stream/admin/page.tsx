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

async function getAdminStats(schoolId: string) {
  // Fetch all stats in parallel for better performance
  const [
    totalCourses,
    totalEnrollments,
    recentCourses,
    enrollmentsWithRevenue,
  ] = await Promise.all([
    // Total courses count
    db.streamCourse.count({
      where: { schoolId },
    }),
    // Total active enrollments
    db.streamEnrollment.count({
      where: { schoolId, isActive: true },
    }),
    // Recent courses (last 5)
    db.streamCourse.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        chapters: {
          include: {
            lessons: true,
          },
        },
        _count: {
          select: {
            enrollments: {
              where: { isActive: true },
            },
          },
        },
      },
    }),
    // Enrollments with course prices for revenue calculation
    db.streamEnrollment.findMany({
      where: { schoolId, isActive: true },
      include: {
        course: {
          select: { price: true },
        },
      },
    }),
  ])

  // Calculate total revenue from active enrollments
  const totalRevenue = enrollmentsWithRevenue.reduce((sum, enrollment) => {
    return sum + (enrollment.course.price || 0)
  }, 0)

  // Calculate growth (comparing this month to last month)
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [thisMonthEnrollments, lastMonthEnrollments] = await Promise.all([
    db.streamEnrollment.count({
      where: {
        schoolId,
        isActive: true,
        createdAt: { gte: thisMonthStart },
      },
    }),
    db.streamEnrollment.count({
      where: {
        schoolId,
        isActive: true,
        createdAt: { gte: lastMonthStart, lt: thisMonthStart },
      },
    }),
  ])

  let growthPercent = 0
  if (lastMonthEnrollments > 0) {
    growthPercent = Math.round(
      ((thisMonthEnrollments - lastMonthEnrollments) / lastMonthEnrollments) *
        100
    )
  } else if (thisMonthEnrollments > 0) {
    growthPercent = 100 // New growth from 0
  }

  return {
    totalCourses,
    totalEnrollments,
    totalRevenue,
    growthPercent,
    recentCourses,
  }
}

export default async function StreamAdminDashboardPage({ params }: Props) {
  const { lang, subdomain } = await params
  // Parallelize independent async operations to avoid request waterfalls
  const [dictionary, { schoolId }, session] = await Promise.all([
    getDictionary(lang),
    getTenantContext(),
    auth(),
  ])

  // Check admin access
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

  // Fetch admin stats
  const stats = schoolId ? await getAdminStats(schoolId) : null

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
