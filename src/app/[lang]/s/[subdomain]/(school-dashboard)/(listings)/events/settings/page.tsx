import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import EventSettingsContent from "@/components/school-dashboard/listings/events/settings/content"

export const metadata = { title: "Dashboard: Event Settings" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <EventSettingsContent dictionary={dictionary.school} lang={lang} />
}
