import { SearchParams } from "nuqs/server"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import GuardiansContent from "@/components/school-dashboard/listings/students/guardians/content"

export const metadata = { title: "Dashboard: Guardians" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<SearchParams>
}

export default async function Page({ params, searchParams }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <GuardiansContent
      searchParams={searchParams}
      dictionary={dictionary.school}
    />
  )
}
