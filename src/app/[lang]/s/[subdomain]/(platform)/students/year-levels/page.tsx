import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import YearLevelsContent from "@/components/platform/students/year-levels/content"

export const metadata = { title: "Dashboard: Year Levels" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <YearLevelsContent dictionary={dictionary.school} lang={lang} />
}
