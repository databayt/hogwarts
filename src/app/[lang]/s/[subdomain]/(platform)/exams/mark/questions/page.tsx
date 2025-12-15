import Link from "next/link"
import { auth } from "@/auth"
import { Edit, Plus, Trash } from "lucide-react"

import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"
import { Shell as PageContainer } from "@/components/table/shell"

export const metadata = {
  title: "Question Bank",
  description: "Manage your question library",
}

export default async function QuestionBankPage({
  params,
}: {
  params: Promise<{ lang: Locale }>
}) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const dict = dictionary.marking

  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return (
      <PageContainer>
        <p>{dict.messages.unauthorized}</p>
      </PageContainer>
    )
  }

  const questions = await db.questionBank.findMany({
    where: { schoolId },
    select: {
      id: true,
      questionText: true,
      questionType: true,
      difficulty: true,
      bloomLevel: true,
      points: true,
      createdAt: true,
      subject: {
        select: {
          id: true,
          subjectName: true,
        },
      },
      rubrics: {
        select: {
          id: true,
          criteria: {
            select: {
              id: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <PageHeadingSetter title="Questions" />
          <Button asChild>
            <Link href={`/${lang}/exams/mark/questions/create`}>
              <Plus className="mr-2 h-4 w-4" />
              {dict.buttons.createQuestion}
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <p className="text-muted-foreground text-sm">
              {dict.statistics.totalQuestions}
            </p>
            <h3 className="text-2xl font-bold">{questions.length}</h3>
          </Card>
          <Card className="p-4">
            <p className="text-muted-foreground text-sm">
              {dict.statistics.autoGradable}
            </p>
            <h3 className="text-2xl font-bold">
              {
                questions.filter((q) =>
                  ["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK"].includes(
                    q.questionType
                  )
                ).length
              }
            </h3>
          </Card>
          <Card className="p-4">
            <p className="text-muted-foreground text-sm">
              {dict.statistics.withRubrics}
            </p>
            <h3 className="text-2xl font-bold">
              {questions.filter((q) => q.rubrics.length > 0).length}
            </h3>
          </Card>
        </div>

        <div className="space-y-4">
          {questions.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-4">
                {dict.questionBank.noQuestions}
              </p>
              <Button asChild>
                <Link href={`/${lang}/exams/mark/questions/create`}>
                  <Plus className="mr-2 h-4 w-4" />
                  {dict.questionBank.createFirst}
                </Link>
              </Button>
            </Card>
          ) : (
            questions.map((question) => {
              const questionType =
                question.questionType as keyof typeof dict.questionTypes
              const difficulty =
                question.difficulty.toLowerCase() as keyof typeof dict.difficulty
              const bloomLevel =
                question.bloomLevel.toLowerCase() as keyof typeof dict.bloomLevels

              return (
                <Card key={question.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge variant="outline">
                          {dict.questionTypes[questionType]}
                        </Badge>
                        <Badge variant="secondary">
                          {dict.difficulty[difficulty]}
                        </Badge>
                        <Badge variant="outline">
                          {dict.bloomLevels[bloomLevel]}
                        </Badge>
                      </div>
                      <p className="mb-2 text-sm font-medium">
                        {question.questionText}
                      </p>
                      <div className="text-muted-foreground flex items-center gap-4 text-xs">
                        <span>{question.subject.subjectName}</span>
                        <span>
                          {question.points.toString()}{" "}
                          {dict.questionBank.points}
                        </span>
                        {question.rubrics.length > 0 && (
                          <span>
                            {question.rubrics[0].criteria.length}{" "}
                            {dict.questionBank.criteria}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </PageContainer>
  )
}
