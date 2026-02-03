import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import TeacherSettingsContent from "@/components/school-dashboard/listings/teachers/settings/content"

export const metadata = { title: "Dashboard: Teacher Settings" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <TeacherSettingsContent dictionary={dictionary.school} lang={lang} />
}
