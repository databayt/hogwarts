import { SearchParams } from "nuqs/server"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import TimetableByTeacherContent from "@/components/platform/timetable/by-teacher/content"

export const metadata = { title: "Dashboard: Timetable by Teacher" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<SearchParams>
}

export default async function Page({ params, searchParams }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <TimetableByTeacherContent
      searchParams={searchParams}
      dictionary={dictionary.school}
    />
  )
}
