import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import ChartsContent from "@/components/platform/dashboard/chart-showcase"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Charts({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <ChartsContent dictionary={dictionary} lang={lang} />
}
