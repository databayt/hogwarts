import { ThemeContent } from '@/components/theme/content'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Appearance Settings - Hogwarts',
  description: 'Customize your platform appearance with themes and colors',
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function AppearancePage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <ThemeContent dictionary={dictionary} lang={lang} />
}
