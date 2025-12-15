import { type Metadata } from "next"
import { auth } from "@/auth"
import { AlertTriangle, BarChart3 } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import AnalyticsContent from "@/components/platform/attendance/analytics/content"
import { AttendanceProvider } from "@/components/platform/attendance/core/attendance-context"
import { EarlyWarningContent } from "@/components/platform/attendance/early-warning/content"

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Attendance Analysis",
    description: "Analyze attendance trends and identify at-risk students",
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const session = await auth()

  // Check permissions - only ADMIN and TEACHER can access analytics
  if (
    session?.user?.role !== "ADMIN" &&
    session?.user?.role !== "TEACHER" &&
    session?.user?.role !== "DEVELOPER"
  ) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <h2>Access Denied</h2>
        <p className="text-muted-foreground">
          You do not have permission to access attendance analysis.
        </p>
      </div>
    )
  }

  return (
    <AttendanceProvider>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2>Attendance Analysis</h2>
          <p className="text-muted-foreground">
            Analyze attendance patterns and identify students at risk
          </p>
        </div>

        {/* Tabs for Analytics and Early Warning */}
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="warning" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Early Warning
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="mt-6">
            <AnalyticsContent
              dictionary={dictionary}
              locale={lang}
              schoolId={session?.user?.schoolId || ""}
            />
          </TabsContent>

          <TabsContent value="warning" className="mt-6">
            <EarlyWarningContent locale={lang} />
          </TabsContent>
        </Tabs>
      </div>
    </AttendanceProvider>
  )
}
