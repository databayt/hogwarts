import SubscriptionContent from '@/components/platform/admin/subscription/content'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'

export const metadata = { title: 'Admin: Subscription' }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <SubscriptionContent dictionary={dictionary} lang={lang} />
}