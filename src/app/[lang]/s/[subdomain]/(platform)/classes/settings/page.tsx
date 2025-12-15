import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import ClassSettingsContent from "@/components/platform/classes/settings/content"

export const metadata = { title: "Dashboard: Class Settings" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <ClassSettingsContent dictionary={dictionary.school} lang={lang} />
}
