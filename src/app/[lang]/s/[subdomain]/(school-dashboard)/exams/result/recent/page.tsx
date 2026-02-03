import Link from "next/link"
import { Calendar, TrendingUp, Users } from "lucide-react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { Shell as PageContainer } from "@/components/table/shell"

export const metadata = { title: "Recent Results" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function RecentPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()

  const recentExams = schoolId
    ? await db.exam.findMany({
        where: {
          schoolId,
          status: "COMPLETED",
        },
        include: {
          class: { select: { name: true } },
          subject: { select: { subjectName: true } },
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
        <PageHeadingSetter title="Recent" />

        {recentExams.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                {d?.noRecentResults || "No recent results available"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                <Card key={exam.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{exam.title}</CardTitle>
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      {new Date(exam.examDate).toLocaleDateString()}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4" />
                      <span>{exam.class?.name}</span>
                      <span className="text-muted-foreground">•</span>
                      <span>{exam.subject?.subjectName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-medium">
                        {d?.classAverage || "Average"}:{" "}
                        {averagePercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">
                        {d?.completed || "Completed"}
                      </Badge>
                      <Badge variant="secondary">
                        {totalResults} {d?.students || "students"}
                      </Badge>
                    </div>
                    <Button asChild className="w-full" size="sm">
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
