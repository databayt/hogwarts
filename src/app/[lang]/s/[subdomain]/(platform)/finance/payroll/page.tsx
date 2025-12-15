import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import PayrollContent from "@/components/platform/finance/payroll/content"

export const metadata = { title: "Dashboard: Payroll Processing" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <PayrollContent dictionary={dictionary} lang={lang} />
}
