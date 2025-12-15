import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import ReportsContent from "@/components/platform/school/reports/content"

export const metadata = { title: "School: Reports" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <ReportsContent dictionary={dictionary} lang={lang} />
}
