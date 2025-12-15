import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import TimetableSettingsContent from "@/components/platform/timetable/settings/content"

export const metadata = { title: "Dashboard: Timetable Settings" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <TimetableSettingsContent dictionary={dictionary.school} lang={lang} />
}
