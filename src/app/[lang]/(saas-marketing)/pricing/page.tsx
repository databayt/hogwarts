import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import PricingContent from "@/components/saas-marketing/pricing/content"

export const metadata = {
  title: "Pricing",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Pricing({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <PricingContent dictionary={dictionary} lang={lang} />
}
