import type { Locale } from '@/components/internationalization/config'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  PieChart,
} from 'lucide-react'
import Link from 'next/link'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function ReportsContent({ dictionary, lang }: Props) {
  const d = dictionary?.admin

  return (
    <div className="space-y-6">
      {/* Report Categories */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* User Reports */}
        <Card className="border-primary/20 hover:border-primary/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              User Reports
            </CardTitle>
            <CardDescription>User activity and demographics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Generate reports on user registrations, activity patterns, and role distribution.
            </p>
            <Button asChild>
              <Link href={`/${lang}/admin/reports/users`}>
                Generate User Report
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Financial Reports */}
        <Card className="border-green-500/20 hover:border-green-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Financial Reports
            </CardTitle>
            <CardDescription>Revenue and expense analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Track revenue, expenses, payment trends, and financial performance metrics.
            </p>
            <Button asChild variant="secondary">
              <Link href={`/${lang}/admin/reports/finance`}>
                Generate Financial Report
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Academic Reports */}
        <Card className="border-blue-500/20 hover:border-blue-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Academic Reports
            </CardTitle>
            <CardDescription>Student performance analytics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Analyze student grades, attendance patterns, and academic progress.
            </p>
            <Button asChild variant="secondary">
              <Link href={`/${lang}/admin/reports/academic`}>
                Generate Academic Report
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Custom Reports */}
        <Card className="border-purple-500/20 hover:border-purple-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-500" />
              Custom Reports
            </CardTitle>
            <CardDescription>Build your own reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Create custom reports with specific metrics and filters for your needs.
            </p>
            <Button asChild variant="secondary">
              <Link href={`/${lang}/admin/reports/builder`}>
                Report Builder
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}