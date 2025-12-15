import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import DiscountContent from "@/components/onboarding/discount/content"

export const metadata = {
  title: "Discount | Onboarding",
  description: "Set up discount options for your school.",
}

interface Props {
  params: Promise<{ lang: Locale; id: string }>
}

export default async function Discount({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)

  return <DiscountContent dictionary={dictionary} lang={lang} id={id} />
}
