import { SearchParams } from "nuqs/server"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import StudentReportsContent from "@/components/school-dashboard/listings/students/reports/content"

export const metadata = { title: "Dashboard: Student Reports" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<SearchParams>
}

export default async function Page({ params, searchParams }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <StudentReportsContent
      searchParams={searchParams}
      dictionary={dictionary.school}
    />
  )
}
