// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import Link from "next/link"
import { Calendar, TrendingUp, Users } from "lucide-react"

import { db } from "@/lib/db"
import { formatDate } from "@/lib/i18n-format"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { Shell as PageContainer } from "@/components/table/shell"

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return { title: dictionary?.results?.recentResults || "Recent Results" }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function RecentPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()

  const recentExams = schoolId
    ? await db.schoolExam.findMany({
        where: {
          schoolId,
          status: "COMPLETED",
        },
        include: {
          class: { select: { name: true } },
          subject: { select: { name: true } },
          _count: {
            select: {
              examResults: true,
            },
          },
          examResults: {
            select: {
              marksObtained: true,
            },
          },
        },
        orderBy: {
          examDate: "desc",
        },
        take: 20,
      })
    : []

  const d = dictionary?.results

  return (
    <PageContainer>
      <div className="flex flex-col gap-4">
        <PageHeadingSetter
          title={dictionary?.results?.recentResults || "Recent Results"}
        />

        {recentExams.length === 0 ? (
          <Card className="max-md:bg-muted max-md:border-0">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                {d?.noRecentResults || "No recent results available"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 max-md:grid-cols-2 max-md:gap-3 md:grid-cols-2 lg:grid-cols-3">
            {recentExams.map((exam) => {
              const totalResults = exam._count.examResults
              const averageMarks =
                totalResults > 0
                  ? exam.examResults.reduce(
                      (sum, r) => sum + (r.marksObtained || 0),
                      0
                    ) / totalResults
                  : 0
              const averagePercentage =
                exam.totalMarks > 0 ? (averageMarks / exam.totalMarks) * 100 : 0

              return (
                <Card key={exam.id} className="max-md:bg-muted max-md:border-0">
                  <CardHeader className="max-md:p-4 max-md:pb-2">
                    <CardTitle className="text-lg max-md:line-clamp-2 max-md:text-sm max-md:leading-5">
                      {exam.title}
                    </CardTitle>
                    <div className="text-muted-foreground flex items-center gap-2 text-sm max-md:text-xs">
                      <Calendar className="h-4 w-4" />
                      {formatDate(exam.examDate, lang)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 max-md:space-y-2 max-md:px-4 max-md:pb-4">
                    <div className="flex items-center gap-2 text-sm max-md:flex-wrap max-md:gap-1.5 max-md:text-xs">
                      <Users className="h-4 w-4" />
                      <span>{exam.class?.name}</span>
                      <span className="text-muted-foreground">•</span>
                      <span>{exam.subject?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm max-md:text-xs">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-medium">
                        {d?.classAverage || "Average"}:{" "}
                        {averagePercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 max-md:flex-wrap max-md:gap-1.5">
                      <Badge variant="default">
                        {d?.completed || "Completed"}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="max-md:bg-background"
                      >
                        {totalResults} {d?.students || "students"}
                      </Badge>
                    </div>
                    <Button
                      asChild
                      className="w-full max-md:h-9 max-md:rounded-full"
                      size="sm"
                    >
                      <Link href={`/${lang}/exams/result/${exam.id}`}>
                        {d?.viewResults || "View Results"}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
