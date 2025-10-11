import { EnhancedSettingsContent } from '@/components/platform/settings/content-enhanced'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings - School Management',
  description: 'Manage school settings, users, roles, and permissions'
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <EnhancedSettingsContent dictionary={dictionary} lang={lang} />
}







