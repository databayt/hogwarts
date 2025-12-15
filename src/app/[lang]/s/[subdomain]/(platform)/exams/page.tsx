import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import ExamsContent from "@/components/platform/exams/content"

export const metadata = { title: "Dashboard: Exams" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <ExamsContent dictionary={dictionary} lang={lang} />
}
