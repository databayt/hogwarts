import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import SalaryContent from "@/components/platform/finance/salary/content"

export const metadata = { title: "Dashboard: Salary Management" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <SalaryContent dictionary={dictionary} lang={lang} />
}
