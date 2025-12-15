import { SearchParams } from "nuqs/server"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import CurriculumContent from "@/components/platform/lessons/curriculum/content"

export const metadata = { title: "Dashboard: Curriculum" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<SearchParams>
}

export default async function Page({ params, searchParams }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <CurriculumContent
      searchParams={searchParams}
      dictionary={dictionary.school}
    />
  )
}
