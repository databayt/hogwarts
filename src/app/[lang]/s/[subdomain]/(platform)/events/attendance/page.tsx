import EventAttendanceContent from '@/components/platform/events/attendance/content'
import { SearchParams } from 'nuqs/server'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'

export const metadata = { title: 'Dashboard: Event Attendance' }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<SearchParams>
}

export default async function Page({ params, searchParams }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <EventAttendanceContent searchParams={searchParams} dictionary={dictionary.school} />
}
