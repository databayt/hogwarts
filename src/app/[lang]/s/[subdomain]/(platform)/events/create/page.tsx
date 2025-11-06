import CreateEventContent from '@/components/platform/events/create/content'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'

export const metadata = { title: 'Dashboard: Create Event' }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <CreateEventContent dictionary={dictionary.school} lang={lang} />
}
