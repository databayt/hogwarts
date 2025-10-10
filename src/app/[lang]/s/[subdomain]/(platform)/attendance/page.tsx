import { AttendanceContent } from '@/components/platform/attendance/content'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'

export const metadata = { title: 'Dashboard: Attendance' }

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <AttendanceContent dictionary={dictionary.school} />
}







