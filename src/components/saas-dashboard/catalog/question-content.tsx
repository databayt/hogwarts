import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  HelpCircle,
} from "lucide-react"

import { db } from "@/lib/db"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { Shell as PageContainer } from "@/components/table/shell"

import type { CatalogQuestionRow } from "./question-columns"
import { QuestionTable } from "./question-table"

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

export async function QuestionContent({ lang }: Props) {
  const questions = await db.catalogQuestion.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      questionText: true,
      questionType: true,
      difficulty: true,
      bloomLevel: true,
      approvalStatus: true,
      visibility: true,
      usageCount: true,
      averageScore: true,
      qualityScore: true,
      status: true,
      tags: true,
      createdAt: true,
    },
  })

  const totalQuestions = questions.length
  const approvedCount = questions.filter(
    (q) => q.approvalStatus === "APPROVED"
  ).length
  const pendingCount = questions.filter(
    (q) => q.approvalStatus === "PENDING"
  ).length
  const avgQuality =
    totalQuestions > 0
      ? (
          questions.reduce((sum, q) => sum + q.qualityScore, 0) / totalQuestions
        ).toFixed(1)
      : "0"

  const rows: CatalogQuestionRow[] = questions.map((q) => ({
    ...q,
    questionType: q.questionType as string,
    difficulty: q.difficulty as string,
    bloomLevel: q.bloomLevel as string,
    approvalStatus: q.approvalStatus as string,
    visibility: q.visibility as string,
    status: q.status as string,
  }))

  return (
    <PageContainer>
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Questions
            </CardTitle>
            <HelpCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalQuestions}</p>
            <CardDescription>In the question bank</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{approvedCount}</p>
            <CardDescription>Ready for use</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertTriangle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingCount}</p>
            <CardDescription>Awaiting review</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Quality</CardTitle>
            <BarChart3 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{avgQuality}</p>
            <CardDescription>Quality score</CardDescription>
          </CardContent>
        </Card>
      </div>

      <QuestionTable data={rows} />
    </PageContainer>
  )
}
