// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

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
  const t = dictionary.schoolConsole.reports

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Academic Reports */}
        <Card className="border-blue-500/20 transition-colors hover:border-blue-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              {t.academic.title}
            </CardTitle>
            <CardDescription>{t.academic.subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              {t.academic.description}
            </p>
            <Button asChild>
              <Link href={`/${lang}/exams/result`}>{t.academic.action}</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Attendance Reports */}
        <Card className="border-green-500/20 transition-colors hover:border-green-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              {t.attendance.title}
            </CardTitle>
            <CardDescription>{t.attendance.subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              {t.attendance.description}
            </p>
            <Button asChild variant="secondary">
              <Link href={`/${lang}/attendance/reports`}>
                {t.attendance.action}
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Financial Reports */}
        <Card className="border-purple-500/20 transition-colors hover:border-purple-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-500" />
              {t.financial.title}
            </CardTitle>
            <CardDescription>{t.financial.subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              {t.financial.description}
            </p>
            <Button asChild variant="secondary">
              <Link href={`/${lang}/finance/reports`}>
                {t.financial.action}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
