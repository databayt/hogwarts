import { AttendanceProvider } from '@/components/platform/attendance/core/attendance-context'
import { AttendanceOverviewContent } from '@/components/platform/attendance/overview/content'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import { auth } from '@/auth'

export const metadata = { title: 'Dashboard: Attendance Overview' }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const session = await auth()

  // Determine user permissions based on role
  const permissions = {
    canMarkManual: session?.user?.role === 'ADMIN' || session?.user?.role === 'TEACHER',
    canUseGeofence: true,
    canScanQR: true,
    canScanBarcode: session?.user?.role === 'ADMIN' || session?.user?.role === 'TEACHER',
    canUseRFID: session?.user?.role === 'ADMIN',
    canUseBiometric: session?.user?.role === 'ADMIN',
    canUseNFC: session?.user?.role === 'ADMIN' || session?.user?.role === 'TEACHER',
    canUseBluetooth: session?.user?.role === 'ADMIN',
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
      <AttendanceOverviewContent
        dictionary={dictionary}
        locale={lang}
      />
    </AttendanceProvider>
  )
}