import { SearchParams } from "nuqs/server"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import TimetableByRoomContent from "@/components/school-dashboard/timetable/by-room/content"

export const metadata = { title: "Dashboard: Timetable by Room" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<SearchParams>
}

export default async function Page({ params, searchParams }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <TimetableByRoomContent
      searchParams={searchParams}
      dictionary={dictionary.school}
    />
  )
}
