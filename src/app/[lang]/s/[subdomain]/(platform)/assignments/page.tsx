import { SearchParams } from "nuqs/server"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import AssignmentsContent from "@/components/platform/assignments/content"

export const metadata = { title: "Dashboard: Assignments" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<SearchParams>
}

export default async function Page({ params, searchParams }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <AssignmentsContent
      searchParams={searchParams}
      dictionary={dictionary}
      lang={lang}
    />
  )
}
