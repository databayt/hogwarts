import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import StudentSettingsContent from "@/components/platform/students/settings/content"

export const metadata = { title: "Dashboard: Student Settings" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <StudentSettingsContent dictionary={dictionary.school} lang={lang} />
}
