import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import AcademicContent from "@/components/school-marketing/apply/academic/content"

export const metadata = {
  title: "Academic Information | Apply",
  description: "Enter your academic history and preferences.",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function AcademicPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <AcademicContent dictionary={dictionary} />
}
