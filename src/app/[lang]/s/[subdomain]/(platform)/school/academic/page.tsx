import { AcademicContent } from '@/components/platform/settings/academic/content'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Academic Year Setup - School Management',
  description: 'Configure academic years, terms, and daily periods for your school'
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <AcademicContent dictionary={dictionary} lang={lang} />
}
