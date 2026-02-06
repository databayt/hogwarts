import { notFound } from "next/navigation"
import { Zap } from "lucide-react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { Shell as PageContainer } from "@/components/table/shell"

export const metadata = { title: "Bulk Marking" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function BulkMarkingPage({ params }: Props) {
  const { lang, id: examId } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return notFound()
  }

  const exam = await db.exam.findUnique({
    where: { id: examId, schoolId },
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

  const d = dictionary?.marking

  return (
    <PageContainer>
      <div className="flex flex-col gap-4">
        <PageHeadingSetter
          title="Bulk Grade"
          description={`${exam.class?.name} - ${exam.subject?.subjectName}`}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              {d?.bulkMarkingFeature || "Bulk Marking"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {d?.bulkMarkingDescription ||
                "Grade multiple student submissions at once using automated marking rules."}
            </p>
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {d?.examStats || "Exam Statistics"}:
              </p>
              <ul className="text-muted-foreground space-y-1 text-sm">
                <li>
                  • {d?.totalMarks || "Total Marks"}: {exam.totalMarks}
                </li>
                <li>
                  • {d?.totalResults || "Total Results"}:{" "}
                  {exam._count.examResults}
                </li>
              </ul>
            </div>
            <Button>
              <Zap className="me-2 h-4 w-4" />
              {d?.startBulkMarking || "Start Bulk Marking"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
