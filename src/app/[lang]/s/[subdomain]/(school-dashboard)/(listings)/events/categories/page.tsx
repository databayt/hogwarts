import { SearchParams } from "nuqs/server"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import EventCategoriesContent from "@/components/school-dashboard/listings/events/categories/content"

export const metadata = { title: "Dashboard: Event Categories" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<SearchParams>
}

export default async function Page({ params, searchParams }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <EventCategoriesContent
      searchParams={searchParams}
      dictionary={dictionary.school}
    />
  )
}
