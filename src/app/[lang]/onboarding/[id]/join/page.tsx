import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import JoinContent from "@/components/onboarding/join/content"

export const metadata = {
  title: "Join | Onboarding",
  description: "Join your school community.",
}

interface Props {
  params: Promise<{ lang: Locale; id: string }>
}

export default async function Join({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)

  return <JoinContent dictionary={dictionary} lang={lang} id={id} />
}
