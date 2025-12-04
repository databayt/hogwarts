import CardsContent from "@/components/platform/dashboard/cards/content"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { type Locale } from "@/components/internationalization/config"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Cards({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <CardsContent dictionary={dictionary} lang={lang} />
}
