import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import SubscriptionContent from "@/components/platform/school/subscription/content"

export const metadata = { title: "School: Subscription" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <SubscriptionContent dictionary={dictionary} lang={lang} />
}
