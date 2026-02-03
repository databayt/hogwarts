import Link from "next/link"
import { notFound } from "next/navigation"
import { Calendar, Clock, FileText, Pencil, Users } from "lucide-react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { Shell as PageContainer } from "@/components/table/shell"

export const metadata = { title: "Exam Details" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function Page({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return notFound()
  }

  const exam = await db.exam.findUnique({
    where: { id, schoolId },
    include: {
      class: { select: { name: true } },
      subject: { select: { subjectName: true } },
      _count: {
        select: {
          examResults: true,
        },
      },
    },
  })

  if (!exam) {
    return notFound()
  }

  const d = dictionary?.school?.exams

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex items-center justify-between">
          <PageHeadingSetter
            title={exam.title}
            description={exam.description || d?.description || "Exam Details"}
          />
          <Button asChild>
            <Link href={`/${lang}/exams/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              {d?.edit || "Edit"}
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                {d?.examDate || "Exam Date"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {new Date(exam.examDate).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                {d?.time || "Time"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {exam.startTime} - {exam.endTime}
              </p>
              <p className="text-muted-foreground text-sm">
                {exam.duration} {d?.minutes || "minutes"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4" />
                {d?.marks || "Marks"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{exam.totalMarks}</p>
              <p className="text-muted-foreground text-sm">
                {d?.passing || "Passing"}: {exam.passingMarks}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4" />
                {d?.class || "Class"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{exam.class?.name}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {d?.subject || "Subject"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">
                {exam.subject?.subjectName}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {d?.status || "Status"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                variant={exam.status === "COMPLETED" ? "default" : "secondary"}
              >
                {exam.status}
              </Badge>
              <p className="text-muted-foreground mt-2 text-sm">
                {exam.examType}
              </p>
            </CardContent>
          </Card>
        </div>

        {exam.instructions && (
          <Card>
            <CardHeader>
              <CardTitle>{d?.instructions || "Instructions"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{exam.instructions}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{d?.statistics || "Statistics"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {d?.totalResults || "Total Results"}: {exam._count.examResults}
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
