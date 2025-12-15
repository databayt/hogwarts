import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import MarketingContent from "@/components/marketing/content"

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Home({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <MarketingContent dictionary={dictionary} lang={lang} />
}
