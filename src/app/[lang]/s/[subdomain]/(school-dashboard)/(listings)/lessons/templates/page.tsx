import { SearchParams } from "nuqs/server"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import LessonTemplatesContent from "@/components/school-dashboard/listings/lessons/templates/content"

export const metadata = { title: "Dashboard: Lesson Templates" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<SearchParams>
}

export default async function Page({ params, searchParams }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <LessonTemplatesContent
      searchParams={searchParams}
      dictionary={dictionary.school}
    />
  )
}
