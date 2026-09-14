// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { Edit, Plus, Trash } from "lucide-react"

import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { Shell as PageContainer } from "@/components/table/shell"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title: dictionary?.marking?.questionBank?.title || "Question Bank",
    description:
      dictionary?.marking?.questionBank?.description ||
      "Manage your question library",
  }
}

export default async function QuestionBankPage({
  params,
}: {
  params: Promise<{ lang: Locale }>
}) {
  const { lang } = await params

  const session = await auth()
  if (["STUDENT", "GUARDIAN"].includes(session?.user?.role || "")) {
    redirect(`/${lang}/exams`)
  }

  const dictionary = await getDictionary(lang)
  const dict = dictionary.marking
  // `dict.questionTypes` keys are camelCase; QuestionBank.questionType is an
  // upper-snake Prisma enum (MULTIPLE_CHOICE, FILL_BLANK, ...) — used as-is
  // as a lookup key it never matched and the type badge rendered blank.
  const QUESTION_TYPE_KEY: Partial<
    Record<string, keyof typeof dict.questionTypes>
  > = {
    MULTIPLE_CHOICE: "multipleChoice",
    TRUE_FALSE: "trueFalse",
    SHORT_ANSWER: "shortAnswer",
    ESSAY: "essay",
    FILL_BLANK: "fillInBlank",
    MATCHING: "matching",
  }
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
          name: true,
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
        <div className="flex items-center justify-between max-md:flex-wrap max-md:gap-3">
          <PageHeadingSetter title={dict.questionBank.title} />
          <Button
            asChild
            className="max-md:h-10 max-md:w-auto max-md:rounded-full max-md:px-5"
          >
            <Link href={`/${lang}/exams/mark/questions/create`}>
              <Plus className="me-2 h-4 w-4" />
              {dict.buttons.createQuestion}
            </Link>
          </Button>
        </div>

        <div className="max-md:bg-border grid gap-4 max-md:grid-cols-2 max-md:gap-px max-md:overflow-hidden max-md:rounded-xl md:grid-cols-3 max-md:[&>*:last-child:nth-child(odd)]:col-span-2">
          <Card className="max-md:bg-muted p-4 max-md:h-full max-md:rounded-none max-md:border-0 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <p className="text-muted-foreground text-sm max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
              {dict.statistics.totalQuestions}
            </p>
            <h3 className="text-2xl font-bold max-md:text-lg max-md:leading-7 max-md:tabular-nums">
              {questions.length}
            </h3>
          </Card>
          <Card className="max-md:bg-muted p-4 max-md:h-full max-md:rounded-none max-md:border-0 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <p className="text-muted-foreground text-sm max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
              {dict.statistics.autoGradable}
            </p>
            <h3 className="text-2xl font-bold max-md:text-lg max-md:leading-7 max-md:tabular-nums">
              {
                questions.filter((q) =>
                  ["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK"].includes(
                    q.questionType
                  )
                ).length
              }
            </h3>
          </Card>
          <Card className="max-md:bg-muted p-4 max-md:h-full max-md:rounded-none max-md:border-0 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <p className="text-muted-foreground text-sm max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
              {dict.statistics.withRubrics}
            </p>
            <h3 className="text-2xl font-bold max-md:text-lg max-md:leading-7 max-md:tabular-nums">
              {questions.filter((q) => q.rubrics.length > 0).length}
            </h3>
          </Card>
        </div>

        <div className="space-y-4">
          {questions.length === 0 ? (
            <Card className="max-md:bg-muted p-12 text-center max-md:border-0">
              <p className="text-muted-foreground mb-4">
                {dict.questionBank.noQuestions}
              </p>
              <Button
                asChild
                className="max-md:h-10 max-md:w-auto max-md:rounded-full max-md:px-5"
              >
                <Link href={`/${lang}/exams/mark/questions/create`}>
                  <Plus className="me-2 h-4 w-4" />
                  {dict.questionBank.createFirst}
                </Link>
              </Button>
            </Card>
          ) : (
            questions.map((question) => {
              const questionTypeKey = QUESTION_TYPE_KEY[question.questionType]
              const questionTypeLabel = questionTypeKey
                ? dict.questionTypes[questionTypeKey]
                : question.questionType
              const difficulty =
                question.difficulty.toLowerCase() as keyof typeof dict.difficulty
              const bloomLevel =
                question.bloomLevel.toLowerCase() as keyof typeof dict.bloomLevels

              return (
                <Card
                  key={question.id}
                  className="max-md:bg-muted p-4 max-md:border-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2 max-md:flex-wrap">
                        <Badge variant="outline">{questionTypeLabel}</Badge>
                        <Badge
                          variant="secondary"
                          className="max-md:bg-background"
                        >
                          {dict.difficulty[difficulty]}
                        </Badge>
                        <Badge variant="outline">
                          {dict.bloomLevels[bloomLevel]}
                        </Badge>
                      </div>
                      <p className="mb-2 text-sm font-medium">
                        {question.questionText}
                      </p>
                      <div className="text-muted-foreground flex items-center gap-4 text-xs max-md:flex-wrap max-md:gap-x-3 max-md:gap-y-1">
                        <span>{question.subject.name}</span>
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
