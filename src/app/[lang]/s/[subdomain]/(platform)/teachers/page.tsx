import TeachersContent from '@/components/platform/teachers/content'
import { SearchParams } from 'nuqs/server'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'

export const metadata = { title: 'Dashboard: Teachers' }

interface Props {
  params: Promise<{ lang: Locale }>
  searchParams: Promise<SearchParams>
}

export default async function Page({ params, searchParams }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <TeachersContent searchParams={searchParams} dictionary={dictionary.school} />
}


