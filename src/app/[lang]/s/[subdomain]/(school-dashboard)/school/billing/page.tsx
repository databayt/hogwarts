import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { constructMetadata } from "@/components/saas-marketing/pricing/lib/utils"
import BillingContent from "@/components/school-dashboard/billing/content"

export const metadata = constructMetadata({
  title: "Billing – School Administration",
  description: "Manage billing, subscription, and payment information.",
})

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Billing({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <BillingContent dictionary={dictionary} lang={lang} />
}
