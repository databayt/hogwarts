import { AttendanceProvider } from '@/components/platform/attendance/core/attendance-context'
import { AttendanceContent } from '@/components/platform/attendance/content'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import { auth } from '@/auth'

export const metadata = { title: 'Dashboard: Manual Attendance' }

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
          You do not have permission to access manual attendance marking.
        </p>
      </div>
    )
  }

  return (
    <AttendanceProvider initialMethod="MANUAL">
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-lg">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Manual Attendance</h1>
            <p className="text-muted-foreground">
              Mark attendance manually for your class
            </p>
          </div>
        </div>
        <AttendanceContent dictionary={dictionary} />
      </div>
    </AttendanceProvider>
  )
}