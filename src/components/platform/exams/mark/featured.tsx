"use client"

// Featured Questions Component - Displays high-quality, frequently used questions
import Link from "next/link"
import type {
  BloomLevel,
  DifficultyLevel,
  QuestionType,
  Rubric,
} from "@prisma/client"
import { Award, Star, ThumbsUp, TrendingUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { QuestionCard } from "./card"

interface FeaturedQuestion {
  id: string
  questionText: string
  questionType: QuestionType
  difficulty: DifficultyLevel
  bloomLevel: BloomLevel
  points: number
  subject: { subjectName: string }
  tags?: string[]
  rubrics?: Rubric[]
  createdAt: Date
  _count: {
    generatedExamQuestions: number
    studentAnswers: number
  }
  averageScore?: number
  usageRank?: number
}

interface FeaturedQuestionsProps {
  questions: FeaturedQuestion[]
  dictionary: Dictionary
  locale: string
}

export function FeaturedQuestions({
  questions,
  dictionary,
  locale,
}: FeaturedQuestionsProps) {
  const dict = dictionary.marking

  // Calculate featured categories
  const mostUsed = [...questions]
    .sort(
      (a, b) =>
        b._count.generatedExamQuestions - a._count.generatedExamQuestions
    )
    .slice(0, 6)

  const highestRated = questions
    .filter((q) => q.averageScore !== undefined)
    .sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0))
    .slice(0, 6)

  const recentlyAdded = [...questions]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 6)

  const trending = questions
    .filter((q) => q._count.studentAnswers > 10) // At least 10 responses
    .sort((a, b) => {
      // Sort by recent usage (answers in last 30 days would be ideal, but using total for now)
      return b._count.studentAnswers - a._count.studentAnswers
    })
    .slice(0, 6)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Featured Questions</h2>
        <p className="text-muted-foreground text-sm">
          High-quality questions recommended based on usage and performance
        </p>
      </div>

      {/* Most Used Questions */}
      {mostUsed.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-primary h-5 w-5" />
              <h3 className="text-lg font-semibold">Most Used Questions</h3>
              <Badge variant="secondary">{mostUsed.length}</Badge>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${locale}/exams/mark/questions`}>View All</Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mostUsed.map((question, index) => (
              <div key={question.id} className="relative">
                {index < 3 && (
                  <Badge
                    variant="default"
                    className="absolute -top-2 -right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full p-0"
                  >
                    #{index + 1}
                  </Badge>
                )}
                <QuestionCard
                  id={question.id}
                  questionText={question.questionText}
                  questionType={question.questionType}
                  difficulty={question.difficulty}
                  bloomLevel={question.bloomLevel}
                  points={Number(question.points)}
                  subjectName={question.subject.subjectName}
                  tags={question.tags}
                  usageCount={question._count.generatedExamQuestions}
                  averageScore={question.averageScore}
                  hasRubric={
                    question.rubrics ? question.rubrics.length > 0 : false
                  }
                  dictionary={dictionary}
                  locale={locale}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Highest Rated Questions */}
      {highestRated.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <h3 className="text-lg font-semibold">Highest Rated Questions</h3>
              <Badge variant="secondary">{highestRated.length}</Badge>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${locale}/exams/mark/questions?sort=rating`}>
                View All
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {highestRated.map((question) => (
              <QuestionCard
                key={question.id}
                id={question.id}
                questionText={question.questionText}
                questionType={question.questionType}
                difficulty={question.difficulty}
                bloomLevel={question.bloomLevel}
                points={Number(question.points)}
                subjectName={question.subject.subjectName}
                tags={question.tags}
                usageCount={question._count.generatedExamQuestions}
                averageScore={question.averageScore}
                hasRubric={
                  question.rubrics ? question.rubrics.length > 0 : false
                }
                dictionary={dictionary}
                locale={locale}
              />
            ))}
          </div>
        </section>
      )}

      {/* Trending Questions */}
      {trending.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">Trending Now</h3>
              <Badge variant="secondary">{trending.length}</Badge>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${locale}/exams/mark/questions?sort=trending`}>
                View All
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trending.map((question) => (
              <QuestionCard
                key={question.id}
                id={question.id}
                questionText={question.questionText}
                questionType={question.questionType}
                difficulty={question.difficulty}
                bloomLevel={question.bloomLevel}
                points={Number(question.points)}
                subjectName={question.subject.subjectName}
                tags={question.tags}
                usageCount={question._count.generatedExamQuestions}
                averageScore={question.averageScore}
                hasRubric={
                  question.rubrics ? question.rubrics.length > 0 : false
                }
                dictionary={dictionary}
                locale={locale}
              />
            ))}
          </div>
        </section>
      )}

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Question Bank Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <p className="text-primary text-3xl font-bold">
                {questions.length}
              </p>
              <p className="text-muted-foreground text-sm">Total Questions</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {mostUsed.length}
              </p>
              <p className="text-muted-foreground text-sm">Popular Questions</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">
                {
                  questions.filter((q) => q.rubrics && q.rubrics.length > 0)
                    .length
                }
              </p>
              <p className="text-muted-foreground text-sm">With Rubrics</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {questions.reduce((sum, q) => sum + q._count.studentAnswers, 0)}
              </p>
              <p className="text-muted-foreground text-sm">Total Responses</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {questions.length === 0 && (
        <div className="py-12 text-center">
          <ThumbsUp className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-semibold">
            No Featured Questions Yet
          </h3>
          <p className="text-muted-foreground mb-4 text-sm">
            Start creating questions to see featured recommendations here
          </p>
          <Button asChild>
            <Link href={`/${locale}/exams/mark/questions/create`}>
              {dict.questionBank.createFirst}
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
