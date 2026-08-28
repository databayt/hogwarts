// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Suspense } from "react"
import { Metadata } from "next"
import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import {
  LumosCoursesContent,
  LumosCoursesLoadingSkeleton,
} from "@/components/lumos/courses/content"
import { getAllCatalogCourses } from "@/components/lumos/data/catalog/get-all-courses"
import { lumosCoursesSearchParams } from "@/components/lumos/list-params"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary.lumos?.courses?.title || "All Courses",
    description:
      dictionary.lumos?.courses?.description ||
      "Browse our comprehensive course catalog",
  }
}

export default async function LumosCoursesPage({
  params,
  searchParams,
}: Props) {
  const { lang } = await params
  const [dictionary, { schoolId }, session] = await Promise.all([
    getDictionary(lang),
    getTenantContext(),
    auth(),
  ])
  const search = lumosCoursesSearchParams.parse(await searchParams)

  const userRole = session?.user?.role || null
  const userId = session?.user?.id || null

  return (
    <Suspense fallback={<LumosCoursesLoadingSkeleton />}>
      <CoursesRenderer
        lang={lang}
        schoolId={schoolId}
        dictionary={dictionary.lumos}
        search={search}
        userRole={userRole}
        userId={userId}
      />
    </Suspense>
  )
}

async function CoursesRenderer({
  lang,
  schoolId,
  dictionary,
  search,
  userRole,
  userId,
}: {
  lang: string
  schoolId: string | null
  dictionary: any
  search: {
    page: number
    perPage: number
    search: string
    title: string
    category: string
    level: string
    sort: { id: string; desc: boolean }[]
  }
  userRole: string | null
  userId: string | null
}) {
  if (!schoolId) {
    return (
      <LumosCoursesContent
        dictionary={dictionary}
        lang={lang}
        courses={[]}
        totalCount={0}
        page={1}
        perPage={12}
        activeGrade=""
        search=""
        userRole={userRole}
        userId={userId}
      />
    )
  }

  const { rows, count } = await getAllCatalogCourses({
    page: search.page,
    perPage: search.perPage,
    search: search.search || undefined,
    title: search.title || undefined,
    category: search.category || undefined,
    grade: search.level ? parseInt(search.level) : undefined,
    lang,
  })

  return (
    <LumosCoursesContent
      dictionary={dictionary}
      lang={lang}
      courses={rows}
      totalCount={count}
      page={search.page}
      perPage={search.perPage}
      activeGrade={search.level || ""}
      search={search.search}
      userRole={userRole}
      userId={userId}
    />
  )
}
