import { TimetableContent } from '@/components/platform/timetable/content'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'

export const metadata = { title: 'Dashboard: Timetable' }

interface TimetablePageProps {
  params: Promise<{ lang: Locale }>
}

export default async function Page({ params }: TimetablePageProps) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <TimetableContent dictionary={dictionary.school} />
}







