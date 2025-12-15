import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import CongratulationsContent from "@/components/onboarding/congratulations/content"

export const metadata = {
  title: "Congratulations",
}

interface Props {
  params: Promise<{ lang: Locale; id: string }>
}

export default async function Congratulations({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)

  return <CongratulationsContent dictionary={dictionary} lang={lang} id={id} />
}
