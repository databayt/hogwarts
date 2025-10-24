import { AttendanceProvider } from '@/components/platform/attendance/core/attendance-context'
import BarcodeAttendanceContent from '@/components/platform/attendance/barcode/content'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import { auth } from '@/auth'

export const metadata = { title: 'Dashboard: Barcode Attendance' }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const session = await auth()

  return (
    <AttendanceProvider initialMethod="BARCODE">
      <BarcodeAttendanceContent
        dictionary={dictionary.school}
        locale={lang}
      />
    </AttendanceProvider>
  )
}