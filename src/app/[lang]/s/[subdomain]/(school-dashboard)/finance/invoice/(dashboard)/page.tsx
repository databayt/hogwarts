import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { DashboardContent } from "@/components/school-dashboard/finance/invoice/dashboard/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Dashboard({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <DashboardContent dictionary={dictionary} lang={lang} />
}
