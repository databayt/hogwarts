import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { AttendanceProvider } from "@/components/platform/attendance/core/attendance-context"
import QRCodeAttendanceContent from "@/components/platform/attendance/qr-code/content"

export const metadata = { title: "Dashboard: QR Code Attendance" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const session = await auth()

  return (
    <AttendanceProvider initialMethod="QR_CODE">
      <QRCodeAttendanceContent
        dictionary={dictionary}
        locale={lang}
        schoolId={session?.user?.schoolId!}
      />
    </AttendanceProvider>
  )
}
