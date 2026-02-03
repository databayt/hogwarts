import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import BarcodeAttendanceContent from "@/components/school-dashboard/attendance/barcode/content"
import { AttendanceProvider } from "@/components/school-dashboard/attendance/core/attendance-context"

export const metadata = { title: "Dashboard: Barcode Attendance" }

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
        dictionary={dictionary}
        locale={lang}
        schoolId={session?.user?.schoolId!}
      />
    </AttendanceProvider>
  )
}
