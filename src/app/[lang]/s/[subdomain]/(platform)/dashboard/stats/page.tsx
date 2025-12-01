import StatsContent from "@/components/platform/dashboard/stats/content"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { type Locale } from "@/components/internationalization/config"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Stats({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <StatsContent dictionary={dictionary} lang={lang} />
}
