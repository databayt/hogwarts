import { auth } from "@/auth"
import { Upload } from "lucide-react"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { BulkUploadContent } from "@/components/school-dashboard/attendance/bulk-upload/content"
import { AttendanceProvider } from "@/components/school-dashboard/attendance/core/attendance-context"

export const metadata = { title: "Dashboard: Bulk Upload Attendance" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const session = await auth()

  // Check permissions - only ADMIN and TEACHER can bulk upload
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "TEACHER") {
    const d = dictionary?.school?.attendance?.bulkUpload?.accessDenied
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <h2>{d?.title || "Access Denied"}</h2>
        <p className="muted">
          {d?.description ||
            "You do not have permission to bulk upload attendance records."}
        </p>
      </div>
    )
  }

  const d = dictionary?.school?.attendance?.bulkUpload

  return (
    <AttendanceProvider initialMethod="BULK_UPLOAD">
      <div className="space-y-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-3">
            <Upload className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1>{d?.title || "Bulk Upload Attendance"}</h1>
            <p className="muted">
              {d?.description ||
                "Upload attendance records in bulk from CSV or Excel files"}
            </p>
          </div>
        </div>
        <BulkUploadContent dictionary={dictionary} />
      </div>
    </AttendanceProvider>
  )
}
