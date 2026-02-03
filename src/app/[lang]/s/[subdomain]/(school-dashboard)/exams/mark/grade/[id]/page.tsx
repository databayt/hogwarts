import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { ArrowLeft, Brain, Save, Zap } from "lucide-react"

import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import {
  formatConfidence,
  formatPoints,
  getAIConfidenceIndicator,
} from "@/components/school-dashboard/exams/mark/utils"
import { Shell as PageContainer } from "@/components/table/shell"

export default async function GradingPage({
  params,
}: {
  params: Promise<{ id: string; lang: Locale }>
}) {
  const { id, lang } = await params
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

  const studentAnswer = await db.studentAnswer.findFirst({
    where: { id, schoolId },
    include: {
      student: {
        include: {
          user: true,
        },
      },
      question: {
        include: {
          rubrics: {
            include: { criteria: true },
          },
        },
      },
      exam: true,
      markingResult: {
        include: { overrides: true },
      },
    },
  })

  if (!studentAnswer) {
    notFound()
  }

  const question = studentAnswer.question
  const result = studentAnswer.markingResult

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <PageHeadingSetter
          title="Grade"
          description={`${studentAnswer.student.user?.username || studentAnswer.student.user?.email || "Unknown Student"} • ${studentAnswer.exam.title}`}
        />
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href={`/${lang}/exams/mark`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {dict.buttons.back}
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline">
              <Zap className="mr-2 h-4 w-4" />
              {dict.buttons.autoGrade}
            </Button>
            <Button variant="outline">
              <Brain className="mr-2 h-4 w-4" />
              {dict.buttons.aiGrade}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="mb-2 font-semibold">{dict.grading.question}</h3>
              <p className="mb-4">{question.questionText}</p>
              <div className="flex gap-2">
                <Badge variant="outline">
                  {
                    dict.questionTypes[
                      question.questionType as keyof typeof dict.questionTypes
                    ]
                  }
                </Badge>
                <Badge variant="secondary">
                  {
                    dict.difficulty[
                      question.difficulty.toLowerCase() as keyof typeof dict.difficulty
                    ]
                  }
                </Badge>
                <Badge variant="outline">
                  {question.points.toString()} {dict.questionBank.points}
                </Badge>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="mb-2 font-semibold">
                {dict.grading.studentAnswer}
              </h3>
              <div className="space-y-4">
                <Badge variant="secondary" className="capitalize">
                  {
                    dict.submissionTypes[
                      studentAnswer.submissionType.toLowerCase() as keyof typeof dict.submissionTypes
                    ]
                  }
                </Badge>

                {studentAnswer.submissionType === "DIGITAL" && (
                  <p className="bg-muted rounded p-4 whitespace-pre-wrap">
                    {studentAnswer.answerText || dict.grading.noAnswer}
                  </p>
                )}

                {studentAnswer.submissionType === "OCR" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        {dict.grading.ocrExtractedText}
                      </span>
                      <Badge
                        variant={
                          studentAnswer.ocrConfidence &&
                          studentAnswer.ocrConfidence > 0.9
                            ? "default"
                            : "destructive"
                        }
                      >
                        {formatConfidence(studentAnswer.ocrConfidence || 0)}
                      </Badge>
                    </div>
                    <p className="bg-muted rounded p-4 whitespace-pre-wrap">
                      {studentAnswer.ocrText || dict.grading.ocrPending}
                    </p>
                  </div>
                )}

                {studentAnswer.submissionType === "UPLOAD" &&
                  studentAnswer.uploadUrl && (
                    <div className="space-y-2">
                      <Label>{dict.grading.uploadedFile}</Label>
                      <Button variant="outline" className="w-full" asChild>
                        <a
                          href={studentAnswer.uploadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {dict.grading.viewUploadedFile}
                        </a>
                      </Button>
                    </div>
                  )}
              </div>
            </Card>

            {question.rubrics.length > 0 && (
              <Card className="p-6">
                <h3 className="mb-4 font-semibold">{dict.rubric.title}</h3>
                <div className="space-y-3">
                  {question.rubrics[0].criteria.map((criterion) => (
                    <div key={criterion.id} className="border-l-2 pl-4">
                      <div className="mb-1 flex items-center justify-between">
                        <h4 className="font-medium">{criterion.criterion}</h4>
                        <Badge variant="outline">
                          {criterion.maxPoints.toString()}{" "}
                          {dict.questionBank.points}
                        </Badge>
                      </div>
                      {criterion.description && (
                        <p className="text-muted-foreground text-sm">
                          {criterion.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            {result && (
              <Card className="p-6">
                <h3 className="mb-4 font-semibold">
                  {dict.grading.currentGrade}
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label>{dict.grading.score}</Label>
                    <p className="text-2xl font-bold">
                      {formatPoints(
                        Number(result.pointsAwarded),
                        Number(result.maxPoints)
                      )}
                    </p>
                  </div>

                  <div>
                    <Label>{dict.grading.status}</Label>
                    <Badge variant="outline">
                      {
                        dict.status[
                          result.status
                            .toLowerCase()
                            .replace("_", "") as keyof typeof dict.status
                        ]
                      }
                    </Badge>
                  </div>

                  <div>
                    <Label>{dict.grading.gradingMethod}</Label>
                    <Badge variant="secondary">
                      {
                        dict.gradingMethods[
                          result.gradingMethod
                            .toLowerCase()
                            .replace(
                              "_",
                              ""
                            ) as keyof typeof dict.gradingMethods
                        ]
                      }
                    </Badge>
                  </div>

                  {result.aiConfidence && (
                    <div>
                      <Label>{dict.grading.aiConfidence}</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="bg-muted h-2 flex-1 rounded-full">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${result.aiConfidence * 100}%` }}
                          />
                        </div>
                        <span className="text-sm">
                          {formatConfidence(result.aiConfidence)}
                        </span>
                      </div>
                    </div>
                  )}

                  {result.aiReasoning && (
                    <div>
                      <Label>{dict.grading.aiReasoning}</Label>
                      <p className="bg-muted mt-1 rounded p-3 text-sm">
                        {result.aiReasoning}
                      </p>
                    </div>
                  )}

                  {result.feedback && (
                    <div>
                      <Label>{dict.grading.feedback}</Label>
                      <p className="bg-muted mt-1 rounded p-3 text-sm">
                        {result.feedback}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            <Card className="p-6">
              <h3 className="mb-4 font-semibold">
                {dict.grading.manualGrading}
              </h3>
              <form className="space-y-4">
                <div>
                  <Label htmlFor="score">{dict.grading.pointsAwarded}</Label>
                  <Input
                    id="score"
                    type="number"
                    min="0"
                    max={Number(question.points)}
                    step="0.1"
                    defaultValue={result ? Number(result.pointsAwarded) : 0}
                  />
                  <p className="text-muted-foreground mt-1 text-xs">
                    {dict.grading.maxPoints}: {question.points.toString()}{" "}
                    {dict.questionBank.points}
                  </p>
                </div>

                <div>
                  <Label htmlFor="feedback">{dict.grading.feedback}</Label>
                  <Textarea
                    id="feedback"
                    rows={6}
                    placeholder={dict.grading.feedbackPlaceholder}
                    defaultValue={result?.feedback || ""}
                  />
                </div>

                <Button type="submit" className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  {dict.buttons.saveGrade}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
