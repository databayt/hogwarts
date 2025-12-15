import { SearchParams } from "nuqs/server"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import TimetableByClassContent from "@/components/platform/timetable/by-class/content"

export const metadata = { title: "Dashboard: Timetable by Class" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<SearchParams>
}

export default async function Page({ params, searchParams }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <TimetableByClassContent
      searchParams={searchParams}
      dictionary={dictionary.school}
    />
  )
}
