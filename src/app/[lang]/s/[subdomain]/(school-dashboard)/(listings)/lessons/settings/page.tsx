import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import LessonSettingsContent from "@/components/school-dashboard/listings/lessons/settings/content"

export const metadata = { title: "Dashboard: Lesson Settings" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <LessonSettingsContent dictionary={dictionary.school} lang={lang} />
}
