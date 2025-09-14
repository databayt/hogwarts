import { AttendanceContent } from '@/components/platform/attendance/content'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'

export const metadata = { title: 'Dashboard: Attendance' }

interface AttendancePageProps {
  params: Promise<{ lang: Locale }>
}

export default async function Page({ params }: AttendancePageProps) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <AttendanceContent dictionary={dictionary.school} />
}







