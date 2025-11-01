import { AttendanceProvider } from '@/components/platform/attendance/core/attendance-context'
import { BulkUploadContent } from '@/components/platform/attendance/bulk-upload/content'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import { auth } from '@/auth'
import { Upload } from 'lucide-react'

export const metadata = { title: 'Dashboard: Bulk Upload Attendance' }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const session = await auth()

  // Check permissions - only ADMIN and TEACHER can bulk upload
  if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'TEACHER') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2>Access Denied</h2>
        <p className="muted">
          You do not have permission to bulk upload attendance records.
        </p>
      </div>
    )
  }

  return (
    <AttendanceProvider initialMethod="BULK_UPLOAD">
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Upload className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1>Bulk Upload Attendance</h1>
            <p className="muted">
              Upload attendance records in bulk from CSV or Excel files
            </p>
          </div>
        </div>
        <BulkUploadContent dictionary={dictionary.school} />
      </div>
    </AttendanceProvider>
  )
}