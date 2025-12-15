import { type Metadata } from "next"
import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { AttendanceContent } from "@/components/platform/attendance/content"
import { AttendanceProvider } from "@/components/platform/attendance/core/attendance-context"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary?.school?.attendance?.manual || "Manual Attendance",
    description: "Mark attendance manually for your class",
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

  // Check permissions
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "TEACHER") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <h2>Access Denied</h2>
        <p className="text-muted-foreground">
          You do not have permission to access manual attendance marking.
        </p>
      </div>
    )
  }

  return (
    <AttendanceProvider initialMethod="MANUAL">
      <div className="space-y-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-3">
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
        <AttendanceContent dictionary={dictionary.school} />
      </div>
    </AttendanceProvider>
  )
}
