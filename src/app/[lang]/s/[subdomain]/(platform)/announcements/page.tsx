import AnnouncementsContent from '@/components/platform/announcements/content'
import { SearchParams } from 'nuqs/server'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'

export const metadata = { title: 'Dashboard: Announcements' }

interface AnnouncementsPageProps {
  params: Promise<{ lang: Locale }>
  searchParams: Promise<SearchParams>
}

export default async function Page({ params, searchParams }: AnnouncementsPageProps) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <AnnouncementsContent searchParams={searchParams} dictionary={dictionary.school} />
}


