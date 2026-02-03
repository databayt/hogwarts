import { SearchParams } from "nuqs/server"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import TimetableConflictsContent from "@/components/school-dashboard/timetable/conflicts/content"

export const metadata = { title: "Dashboard: Timetable Conflicts" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<SearchParams>
}

export default async function Page({ params, searchParams }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <TimetableConflictsContent
      searchParams={searchParams}
      dictionary={dictionary.school}
    />
  )
}
