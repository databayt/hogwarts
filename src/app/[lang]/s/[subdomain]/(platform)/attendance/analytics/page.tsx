import { AttendanceProvider } from '@/components/platform/attendance/core/attendance-context'
import AnalyticsContent from '@/components/platform/attendance/analytics/content'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import { auth } from '@/auth'

export const metadata = { title: 'Dashboard: Attendance Analytics' }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const session = await auth()

  // Check permissions
  if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'TEACHER') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="text-muted-foreground">
          You do not have permission to access attendance analytics.
        </p>
      </div>
    )
  }

  return (
    <AttendanceProvider>
      <AnalyticsContent
        dictionary={dictionary}
        locale={lang}
      />
    </AttendanceProvider>
  )
}