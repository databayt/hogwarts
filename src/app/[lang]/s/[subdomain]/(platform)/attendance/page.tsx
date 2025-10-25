import { AttendanceProvider } from '@/components/platform/attendance/core/attendance-context'
import { AttendanceHub } from '@/components/platform/attendance/core/attendance-hub'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import { auth } from '@/auth'

export const metadata = { title: 'Dashboard: Attendance Hub' }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const session = await auth()

  // Determine user permissions based on role
  const permissions = {
    canMarkManual: true,
    canUseGeofence: true,
    canScanQR: true,
    canScanBarcode: true,
    canUseRFID: session?.user?.role === 'ADMIN' || session?.user?.role === 'TEACHER',
    canUseBiometric: session?.user?.role === 'ADMIN',
    canUseNFC: true,
    canUseBluetooth: true,
    canViewReports: true,
    canExport: session?.user?.role === 'ADMIN' || session?.user?.role === 'TEACHER',
    canEditPast: session?.user?.role === 'ADMIN' || session?.user?.role === 'TEACHER',
    canBulkUpload: session?.user?.role === 'ADMIN' || session?.user?.role === 'TEACHER'
  }

  return (
    <AttendanceProvider
      initialMethod="MANUAL"
      userPermissions={permissions}
    >
      <AttendanceHub
        dictionary={dictionary}
        locale={lang}
      />
    </AttendanceProvider>
  )
}