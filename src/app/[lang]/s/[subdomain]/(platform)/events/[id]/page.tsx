import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getEvent } from "@/components/platform/events/actions"
import { EventDetailContent } from "@/components/platform/events/detail"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function EventDetailPage({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)
  const result = await getEvent({ id })

  return (
    <EventDetailContent
      data={result.success ? result.data : null}
      error={result.success ? null : result.error}
      dictionary={dictionary}
      lang={lang}
    />
  )
}
