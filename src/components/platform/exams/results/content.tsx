import Link from "next/link"
import { Award, Download, FileBarChart, TrendingUp } from "lucide-react"
import { type SearchParams } from "nuqs/server"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface Props {
  dictionary: Dictionary
  lang: Locale
  searchParams: Promise<SearchParams>
}

export default async function ResultsContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()

  // Fetch completed exams with results
  let examsWithResults: Array<{
    id: string
    title: string
    examDate: Date
    className: string
    subjectName: string
    totalStudents: number
    resultsGenerated: number
    averagePercentage: number | null
  }> = []

  if (schoolId) {
    const completedExams = await db.exam.findMany({
      where: {
        schoolId,
        status: "COMPLETED",
      },
      include: {
        class: { select: { name: true } },
        subject: { select: { subjectName: true } },
        examResults: {
          select: {
            id: true,
            percentage: true,
            isAbsent: true,
          },
        },
      },
      orderBy: { examDate: "desc" },
      take: 20,
    })

    examsWithResults = completedExams.map((exam) => {
      const totalStudents = exam.examResults.length
      const presentResults = exam.examResults.filter((r) => !r.isAbsent)
      const averagePercentage =
        presentResults.length > 0
          ? presentResults.reduce((sum, r) => sum + r.percentage, 0) /
            presentResults.length
          : null

      return {
        id: exam.id,
        title: exam.title,
        examDate: exam.examDate,
        className: exam.class.name,
        subjectName: exam.subject.subjectName,
        totalStudents,
        resultsGenerated: totalStudents,
        averagePercentage,
      }
    })
  }

  const r = dictionary?.results

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div></div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/${lang}/exams/certificates`}>
              <Award className="mr-2 h-4 w-4" />
              {lang === "ar" ? "إدارة الشهادات" : "Manage Certificates"}
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/${lang}/exams/result/analytics`}>
              <TrendingUp className="mr-2 h-4 w-4" />
              {r?.actions?.viewAnalytics}
            </Link>
          </Button>
        </div>
      </div>

      {examsWithResults.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileBarChart className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">
              {r?.messages?.noResults}
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              {r?.messages?.noResultsDescription}
            </p>
            <Button asChild>
              <Link href={`/${lang}/exams`}>{r?.actions?.goToExams}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {examsWithResults.map((exam) => (
            <Card key={exam.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>{exam.title}</CardTitle>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {exam.className} • {exam.subjectName} •{" "}
                    {new Date(exam.examDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/${lang}/exams/result/${exam.id}`}>
                      <FileBarChart className="mr-2 h-4 w-4" />
                      {r?.actions?.viewResults}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={`/${lang}/exams/certificates?examId=${exam.id}`}
                    >
                      <Award className="mr-2 h-4 w-4" />
                      {lang === "ar" ? "الشهادات" : "Certificates"}
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    {r?.actions?.exportCSV}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm">
                      {r?.statistics?.totalStudents}
                    </p>
                    <p className="text-2xl font-bold">{exam.totalStudents}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">
                      {r?.statistics?.resultsGenerated}
                    </p>
                    <p className="text-2xl font-bold">
                      {exam.resultsGenerated}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">
                      {r?.statistics?.averageScore}
                    </p>
                    <p className="text-2xl font-bold">
                      {exam.averagePercentage !== null
                        ? `${exam.averagePercentage.toFixed(1)}%`
                        : r?.labels?.notAvailable || "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
