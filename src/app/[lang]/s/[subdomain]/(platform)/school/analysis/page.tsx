import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import AnalysisContent from "@/components/platform/school/analysis/content"

export const metadata = { title: "School: Analysis" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <AnalysisContent dictionary={dictionary} lang={lang} />
}
