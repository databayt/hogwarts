// Main Marking Dashboard Content (Server Component)

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { MarkingTable } from "./table"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, FileText, Clock, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization/config"
import { Shell as PageContainer } from "@/components/table/shell"
import PageHeader from "@/components/atom/page-header"

export async function MarkingContent({
  examId,
  dictionary,
  locale
}: {
  examId?: string
  dictionary: Dictionary
  locale: Locale
}) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return <div>Unauthorized</div>
  }

  // Fetch all submissions that need grading
  const submissions = await db.studentAnswer.findMany({
    where: {
      schoolId,
      ...(examId ? { examId } : {}),
    },
    include: {
      student: true,
      question: true,
      markingResult: true,
    },
    orderBy: {
      submittedAt: "desc",
    },
    take: 100, // Limit to 100 most recent submissions for performance
  })

  // Calculate statistics
  const total = submissions.length
  const notStarted = submissions.filter((s) => !s.markingResult).length
  const inProgress = submissions.filter(
    (s) => s.markingResult && s.markingResult.status === "IN_PROGRESS"
  ).length
  const needsReview = submissions.filter(
    (s) => s.markingResult && s.markingResult.needsReview
  ).length
  const completed = submissions.filter(
    (s) => s.markingResult && s.markingResult.status === "COMPLETED"
  ).length

  const dict = dictionary.marking

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <PageHeader
            title={dict.dashboard}
            description={dict.description}
            className="text-start max-w-none"
          />
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/${locale}/mark/questions`}>
                <FileText className="mr-2 h-4 w-4" />
                {dict.navigation.questionBank}
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/${locale}/mark/questions/create`}>
                <Plus className="mr-2 h-4 w-4" />
                {dict.buttons.newQuestion}
              </Link>
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{dict.statistics.totalSubmissions}</p>
                <h3 className="text-2xl font-bold">{total}</h3>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">{dict.statistics.notStarted}</p>
                <h3 className="text-2xl font-bold">{notStarted}</h3>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">{dict.statistics.needsReview}</p>
                <h3 className="text-2xl font-bold">{needsReview}</h3>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">{dict.statistics.completed}</p>
                <h3 className="text-2xl font-bold">{completed}</h3>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs for filtering */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">{dict.tabs.all} ({total})</TabsTrigger>
            <TabsTrigger value="pending">{dict.tabs.pending} ({notStarted})</TabsTrigger>
            <TabsTrigger value="review">{dict.tabs.review} ({needsReview})</TabsTrigger>
            <TabsTrigger value="completed">{dict.tabs.completed} ({completed})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <MarkingTable data={submissions} dictionary={dictionary} />
          </TabsContent>

          <TabsContent value="pending">
            <MarkingTable
              data={submissions.filter((s) => !s.markingResult)}
              dictionary={dictionary}
            />
          </TabsContent>

          <TabsContent value="review">
            <MarkingTable
              data={submissions.filter(
                (s) => s.markingResult && s.markingResult.needsReview
              )}
              dictionary={dictionary}
            />
          </TabsContent>

          <TabsContent value="completed">
            <MarkingTable
              data={submissions.filter(
                (s) => s.markingResult && s.markingResult.status === "COMPLETED"
              )}
              dictionary={dictionary}
            />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  )
}
