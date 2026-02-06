import { Suspense } from "react"
import { Metadata } from "next"

import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import {
  StreamCoursesContent,
  StreamCoursesLoadingSkeleton,
} from "@/components/stream/courses/content"
import { streamCoursesSearchParams } from "@/components/stream/list-params"
import { getCoursesList } from "@/components/stream/queries"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary.stream?.courses?.title || "All Courses",
    description:
      dictionary.stream?.courses?.description ||
      "Browse our comprehensive course catalog",
  }
}

export default async function StreamCoursesPage({
  params,
  searchParams,
}: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()
  const search = streamCoursesSearchParams.parse(await searchParams)

  return (
    <Suspense fallback={<StreamCoursesLoadingSkeleton />}>
      <CoursesRenderer
        lang={lang}
        schoolId={schoolId}
        dictionary={dictionary.stream}
        search={search}
      />
    </Suspense>
  )
}

async function CoursesRenderer({
  lang,
  schoolId,
  dictionary,
  search,
}: {
  lang: string
  schoolId: string | null
  dictionary: any
  search: {
    page: number
    perPage: number
    title: string
    category: string
    level: string
    sort: { id: string; desc: boolean }[]
  }
}) {
  if (!schoolId) {
    return (
      <StreamCoursesContent
        dictionary={dictionary}
        lang={lang}
        schoolId={schoolId}
        courses={[]}
        totalCount={0}
        page={1}
        perPage={12}
      />
    )
  }

  const { rows, count } = await getCoursesList(schoolId, {
    page: search.page,
    perPage: search.perPage,
    title: search.title || undefined,
    category: search.category || undefined,
    level: search.level || undefined,
    lang,
    sort: search.sort.length > 0 ? search.sort : undefined,
  })

  return (
    <StreamCoursesContent
      dictionary={dictionary}
      lang={lang}
      schoolId={schoolId}
      courses={rows}
      totalCount={count}
      page={search.page}
      perPage={search.perPage}
    />
  )
}
