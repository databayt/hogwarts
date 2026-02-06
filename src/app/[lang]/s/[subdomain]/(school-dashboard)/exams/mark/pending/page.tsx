import Link from "next/link"
import { Calendar, Clock, Users } from "lucide-react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { Shell as PageContainer } from "@/components/table/shell"

export const metadata = { title: "Pending Exams - Marking" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function PendingPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const pendingExams = schoolId
    ? await db.exam.findMany({
        where: {
          schoolId,
          status: "IN_PROGRESS",
          examDate: { lt: today },
        },
        include: {
          class: { select: { name: true } },
          subject: { select: { subjectName: true } },
          _count: {
            select: {
              examResults: true,
            },
          },
        },
        orderBy: {
          examDate: "desc",
        },
      })
    : []

  const d = dictionary?.marking

  return (
    <PageContainer>
      <div className="flex flex-col gap-4">
        <PageHeadingSetter title="Pending" />

        {pendingExams.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                {d?.noPendingExams || "No pending exams to grade"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingExams.map((exam) => (
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
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      <Clock className="me-1 h-3 w-3" />
                      {d?.pending || "Pending"}
                    </Badge>
                    <Badge variant="secondary">
                      {exam._count.examResults} {d?.results || "results"}
                    </Badge>
                  </div>
                  <Button asChild className="w-full" size="sm">
                    <Link href={`/${lang}/exams/mark/grade/${exam.id}`}>
                      {d?.startGrading || "Start Grading"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
