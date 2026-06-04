// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { Upload } from "lucide-react"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { AttendanceAccessDenied } from "@/components/school-dashboard/attendance/atom/access-denied"
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

  // Check permissions - staff only
  const staffRoles = ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"]
  if (!staffRoles.includes(session?.user?.role ?? "")) {
    return <AttendanceAccessDenied lang={lang} />
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
