import { SearchParams } from "nuqs/server"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import TimetableAnalyticsContent from "@/components/school-dashboard/timetable/analytics/content"

export const metadata = { title: "Dashboard: Timetable Analytics" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<SearchParams>
}

export default async function Page({ params, searchParams }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <TimetableAnalyticsContent
      searchParams={searchParams}
      dictionary={dictionary.school}
    />
  )
}
