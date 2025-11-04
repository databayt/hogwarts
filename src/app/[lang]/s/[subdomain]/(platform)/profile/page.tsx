import { ProfileContent } from '@/components/platform/profile/content'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'

export const metadata = { title: 'Dashboard: Profile' }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  // Verify dictionary has required data
  if (!dictionary) {
    console.error('[Profile Page] Dictionary is undefined')
    throw new Error('Failed to load dictionary')
  }

  return <ProfileContent dictionary={dictionary} lang={lang} />
}


