import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import FeesContent from "@/components/school-dashboard/finance/fees/content"

export const metadata = { title: "Dashboard: Student Fees" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <FeesContent dictionary={dictionary} lang={lang} />
}
