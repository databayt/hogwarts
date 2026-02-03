import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import WalletContent from "@/components/school-dashboard/finance/wallet/content"

export const metadata = { title: "Dashboard: Wallet Management" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <WalletContent dictionary={dictionary} lang={lang} />
}
