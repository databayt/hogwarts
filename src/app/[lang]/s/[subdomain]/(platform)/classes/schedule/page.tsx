import { SearchParams } from "nuqs/server"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import ClassScheduleContent from "@/components/platform/classes/schedule/content"

export const metadata = { title: "Dashboard: Class Schedule" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<SearchParams>
}

export default async function Page({ params, searchParams }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <ClassScheduleContent
      searchParams={searchParams}
      dictionary={dictionary.school}
    />
  )
}
