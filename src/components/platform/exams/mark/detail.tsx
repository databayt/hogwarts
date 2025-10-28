// Question Detail View (Server Component)

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Edit, Trash, Copy, TrendingUp, Users, Clock } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization/config"

export async function QuestionDetail({
  questionId,
  dictionary,
  locale,
}: {
  questionId: string
  dictionary: Dictionary
  locale: Locale
}) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return <div>{dictionary.marking.messages.unauthorized}</div>
  }

  // Fetch question with full details
  const question = await db.questionBank.findFirst({
    where: { id: questionId, schoolId },
    select: {
      id: true,
      questionText: true,
      questionType: true,
      difficulty: true,
      bloomLevel: true,
      points: true,
      timeEstimate: true,
      explanation: true,
      sampleAnswer: true,
      tags: true,
      imageUrl: true,
      createdAt: true,
      updatedAt: true,
      subject: {
        select: {
          id: true,
          subjectName: true,
        },
      },
      rubrics: {
        select: {
          id: true,
          title: true,
          description: true,
          totalPoints: true,
          criteria: {
            select: {
              id: true,
              criterion: true,
              description: true,
              maxPoints: true,
              order: true,
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      },
      // Usage statistics
      _count: {
        select: {
          generatedExamQuestions: true,
          studentAnswers: true,
        },
      },
    },
  })

  if (!question) {
    notFound()
  }

  // Calculate average score from student answers
  const studentAnswersWithResults = await db.studentAnswer.findMany({
    where: {
      questionId,
      schoolId,
      markingResult: {
        isNot: null,
      },
    },
    select: {
      markingResult: {
        select: {
          pointsAwarded: true,
          maxPoints: true,
        },
      },
    },
  })

  const averageScore =
    studentAnswersWithResults.length > 0
      ? studentAnswersWithResults.reduce((sum, answer) => {
          const percentage =
            (Number(answer.markingResult?.pointsAwarded) /
              Number(answer.markingResult?.maxPoints)) *
            100
          return sum + percentage
        }, 0) / studentAnswersWithResults.length
      : null

  const dict = dictionary.marking

  const questionTypeKey = question.questionType as keyof typeof dict.questionTypes
  const difficultyKey = question.difficulty.toLowerCase() as keyof typeof dict.difficulty
  const bloomKey = question.bloomLevel.toLowerCase() as keyof typeof dict.bloomLevels

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">{dict.questionBank.title}</h2>
          <p className="text-sm text-muted-foreground">
            Created {question.createdAt.toLocaleDateString()}
            {question.updatedAt > question.createdAt &&
              ` • Updated ${question.updatedAt.toLocaleDateString()}`}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${locale}/mark/questions/${questionId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              {dict.buttons.editQuestion}
            </Link>
          </Button>
          <Button variant="outline" size="sm">
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
          <Button variant="outline" size="sm" className="text-destructive">
            <Trash className="h-4 w-4 mr-2" />
            {dict.buttons.deleteQuestion}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Question Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Question Details</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{dict.questionTypes[questionTypeKey]}</Badge>
                  <Badge
                    variant={
                      question.difficulty === "EASY"
                        ? "default"
                        : question.difficulty === "MEDIUM"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {dict.difficulty[difficultyKey]}
                  </Badge>
                  <Badge variant="outline">{dict.bloomLevels[bloomKey]}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Question Text */}
              <div>
                <h4 className="font-semibold mb-2">Question</h4>
                <p className="text-sm">{question.questionText}</p>
              </div>

              {/* Image */}
              {question.imageUrl && (
                <div>
                  <h4 className="font-semibold mb-2">Image</h4>
                  <img
                    src={question.imageUrl}
                    alt="Question image"
                    className="max-w-md rounded-lg border"
                  />
                </div>
              )}

              <Separator />

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Subject</p>
                  <p className="font-medium">{question.subject.subjectName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{dict.questionForm.points}</p>
                  <p className="font-medium">
                    {question.points.toString()} {dict.questionBank.points}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{dict.questionForm.timeEstimate}</p>
                  <p className="font-medium">{question.timeEstimate} minutes</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Bloom's Level</p>
                  <p className="font-medium">{dict.bloomLevels[bloomKey]}</p>
                </div>
              </div>

              {/* Explanation */}
              {question.explanation && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">{dict.questionForm.explanation}</h4>
                    <p className="text-sm text-muted-foreground">{question.explanation}</p>
                  </div>
                </>
              )}

              {/* Sample Answer */}
              {question.sampleAnswer && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">{dict.questionForm.sampleAnswer}</h4>
                    <p className="text-sm text-muted-foreground">{question.sampleAnswer}</p>
                  </div>
                </>
              )}

              {/* Tags */}
              {question.tags && question.tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">{dict.questionForm.tags}</h4>
                    <div className="flex flex-wrap gap-2">
                      {question.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Rubric (if exists) */}
          {question.rubrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{dict.rubric.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold">{question.rubrics[0].title}</h4>
                  {question.rubrics[0].description && (
                    <p className="text-sm text-muted-foreground">
                      {question.rubrics[0].description}
                    </p>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  {question.rubrics[0].criteria.map((criterion) => (
                    <div key={criterion.id} className="border-l-2 pl-4">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-medium">{criterion.criterion}</h5>
                        <Badge variant="outline">
                          {criterion.maxPoints.toString()} {dict.questionBank.points}
                        </Badge>
                      </div>
                      {criterion.description && (
                        <p className="text-sm text-muted-foreground">
                          {criterion.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <p className="font-semibold">{dict.rubric.totalPoints}</p>
                  <Badge>
                    {question.rubrics[0].totalPoints.toString()} {dict.questionBank.points}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Statistics */}
        <div className="space-y-6">
          {/* Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Times Used</p>
                  <p className="text-2xl font-bold">{question._count.generatedExamQuestions}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Responses</p>
                  <p className="text-2xl font-bold">{question._count.studentAnswers}</p>
                </div>
              </div>

              {averageScore !== null && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Average Score</p>
                    <p className="text-2xl font-bold">{Math.round(averageScore)}%</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/${locale}/exams/create?questionId=${questionId}`}>
                  Add to Exam
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start">
                View Related Questions
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Export Question
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
