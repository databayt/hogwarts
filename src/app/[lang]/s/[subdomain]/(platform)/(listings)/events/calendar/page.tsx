import { SearchParams } from "nuqs/server"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import EventCalendarContent from "@/components/platform/listings/events/calendar/content"

export const metadata = { title: "Dashboard: Event Calendar" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<SearchParams>
}

export default async function Page({ params, searchParams }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <EventCalendarContent
      searchParams={searchParams}
      dictionary={dictionary.school}
    />
  )
}
