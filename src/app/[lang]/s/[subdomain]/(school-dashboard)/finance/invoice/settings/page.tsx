import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { SettingsContent } from "@/components/school-dashboard/finance/invoice/settings/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Settings({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <SettingsContent dictionary={dictionary} lang={lang} />
}
