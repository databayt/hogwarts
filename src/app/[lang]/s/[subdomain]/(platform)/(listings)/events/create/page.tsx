import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import CreateEventContent from "@/components/platform/listings/events/create/content"

export const metadata = { title: "Dashboard: Create Event" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <CreateEventContent dictionary={dictionary.school} lang={lang} />
}
