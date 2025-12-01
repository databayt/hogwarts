import { AttendanceProvider } from '@/components/platform/attendance/core/attendance-context'
import { AttendanceOverviewContent } from '@/components/platform/attendance/overview/content'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import { auth } from '@/auth'
import { type Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary?.school?.attendance?.title || 'Attendance',
    description: dictionary?.school?.attendance?.overview || 'Manage student attendance',
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  // Parallel data fetching
  const [{ lang }, dictionary, session] = await Promise.all([
    params,
    getDictionary((await params).lang),
    auth(),
  ])

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