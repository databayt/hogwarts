import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import AdminCoursesContent from "@/components/stream/admin/courses/content"
import { streamCoursesSearchParams } from "@/components/stream/list-params"
import { getAdminCoursesList } from "@/components/stream/queries"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Your Courses - Stream Admin",
    description: "Manage your courses",
  }
}

async function getCategories(schoolId: string) {
  const categories = await db.streamCategory.findMany({
    where: { schoolId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
    },
  })

  return categories
}

export default async function StreamAdminCoursesPage({
  params,
  searchParams,
}: Props) {
  const { lang, subdomain } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()
  const session = await auth()
  const search = streamCoursesSearchParams.parse(await searchParams)

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

  if (!schoolId) {
    return (
      <AdminCoursesContent
        dictionary={dictionary.stream}
        lang={lang}
        initialData={[]}
        total={0}
        categories={[]}
      />
    )
  }

  const [{ rows, count }, categories] = await Promise.all([
    getAdminCoursesList(schoolId, {
      page: search.page,
      perPage: search.perPage,
      title: search.title || undefined,
      category: search.category || undefined,
      level: search.level || undefined,
      isPublished: search.isPublished || undefined,
      sort: search.sort.length > 0 ? search.sort : undefined,
    }),
    getCategories(schoolId),
  ])

  return (
    <AdminCoursesContent
      dictionary={dictionary.stream}
      lang={lang}
      initialData={rows}
      total={count}
      categories={categories}
    />
  )
}
