import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import AdminCoursesContent from "@/components/stream/admin/courses/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Your Courses - Stream Admin",
    description: "Manage your courses",
  }
}

async function getCourses(schoolId: string) {
  const courses = await db.streamCourse.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
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
  })

  return courses
}

export default async function StreamAdminCoursesPage({ params }: Props) {
  const { lang, subdomain } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()
  const session = await auth()

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

  // Fetch courses
  const courses = schoolId ? await getCourses(schoolId) : []

  return (
    <AdminCoursesContent
      dictionary={dictionary.stream}
      lang={lang}
      courses={courses}
    />
  )
}
