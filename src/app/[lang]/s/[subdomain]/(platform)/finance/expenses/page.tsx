import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import ExpensesContent from "@/components/platform/finance/expenses/content"

export const metadata = { title: "Dashboard: Expense Management" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <ExpensesContent dictionary={dictionary} lang={lang} />
}
