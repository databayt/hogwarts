import { type Metadata } from "next"
import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import AnalyticsContent from "@/components/school-dashboard/attendance/analytics/content"
import { AttendanceProvider } from "@/components/school-dashboard/attendance/core/attendance-context"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary?.school?.attendance?.analytics || "Attendance Analytics",
    description: "View attendance trends, patterns, and insights",
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
        schoolId={session.user.schoolId!}
      />
    </AttendanceProvider>
  )
}
