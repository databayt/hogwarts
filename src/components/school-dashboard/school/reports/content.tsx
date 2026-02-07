import Link from "next/link"
import { BarChart3, DollarSign, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function ReportsContent({ dictionary, lang }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Academic Reports */}
        <Card className="border-blue-500/20 transition-colors hover:border-blue-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Academic Reports
            </CardTitle>
            <CardDescription>Student performance analytics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Analyze student grades, exam results, and academic progress.
            </p>
            <Button asChild>
              <Link href={`/${lang}/exams/results`}>View Academic Reports</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Attendance Reports */}
        <Card className="border-green-500/20 transition-colors hover:border-green-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              Attendance Reports
            </CardTitle>
            <CardDescription>Attendance patterns and trends</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              View attendance records, absence patterns, and class
              participation.
            </p>
            <Button asChild variant="secondary">
              <Link href={`/${lang}/attendance/reports`}>
                View Attendance Reports
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Financial Reports */}
        <Card className="border-purple-500/20 transition-colors hover:border-purple-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-500" />
              Financial Reports
            </CardTitle>
            <CardDescription>Revenue and expense analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Track revenue, expenses, and financial performance metrics.
            </p>
            <Button asChild variant="secondary">
              <Link href={`/${lang}/finance/reports`}>
                View Financial Reports
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
