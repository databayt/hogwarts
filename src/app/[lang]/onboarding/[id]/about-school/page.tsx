import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import AboutSchoolContent from "@/components/onboarding/about-school/content"

export const metadata = {
  title: "About Your School",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function AboutSchool({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <AboutSchoolContent dictionary={dictionary.school} />
}
