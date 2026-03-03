"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { MockExamData, MockQuestionWithAnswer } from "./take-actions"
import { submitMockExam } from "./take-actions"

interface MockExamTakingProps {
  exam: MockExamData
  dictionary: Dictionary
}

type Phase = "taking" | "submitting" | "results"

export function MockExamTaking({ exam, dictionary }: MockExamTakingProps) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>("taking")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [timeLeft, setTimeLeft] = useState(
    exam.durationMinutes ? exam.durationMinutes * 60 : null
  )
  const [results, setResults] = useState<{
    score: number
    totalPoints: number
    percentage: number
    questions: MockQuestionWithAnswer[]
  } | null>(null)

  const d = dictionary?.school?.exams

  // Timer
  useEffect(() => {
    if (phase !== "taking" || timeLeft === null) return

    if (timeLeft <= 0) {
      handleSubmit()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null))
    }, 1000)

    return () => clearInterval(timer)
  }, [phase, timeLeft])

  const currentQuestion = exam.questions[currentIndex]
  const answeredCount = Object.keys(answers).length
  const progress = (answeredCount / exam.totalQuestions) * 100

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }, [])

  const setAnswer = useCallback(
    (questionId: string, value: string | string[]) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }))
    },
    []
  )

  const handleSubmit = useCallback(async () => {
    setPhase("submitting")
    const result = await submitMockExam({
      catalogExamId: exam.id,
      answers,
    })

    if (result.success && result.data) {
      setResults(result.data)
      setPhase("results")
    } else {
      setPhase("taking")
    }
  }, [exam.id, answers])

  if (phase === "submitting") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
          <p className="text-muted-foreground mt-4">
            {d?.submitting || "Grading your answers..."}
          </p>
        </div>
      </div>
    )
  }

  if (phase === "results" && results) {
    return (
      <MockExamResults
        exam={exam}
        results={results}
        answers={answers}
        dictionary={dictionary}
        onBack={() => router.back()}
      />
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{exam.title}</h2>
          <p className="text-muted-foreground text-sm">
            {exam.subjectName} &middot; {d?.mockExam || "Mock Exam"}
          </p>
        </div>
        {timeLeft !== null && (
          <Badge
            variant={timeLeft < 300 ? "destructive" : "secondary"}
            className="gap-1 text-base"
          >
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </Badge>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>
            {d?.question || "Question"} {currentIndex + 1}/{exam.totalQuestions}
          </span>
          <span>
            {answeredCount}/{exam.totalQuestions} {d?.answered || "answered"}
          </span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-base">
                {currentIndex + 1}. {currentQuestion.questionText}
              </CardTitle>
              <Badge variant="outline">{currentQuestion.points} pts</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <QuestionInput
              question={currentQuestion}
              value={answers[currentQuestion.id]}
              onChange={(val) => setAnswer(currentQuestion.id, val)}
            />
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => i - 1)}
        >
          <ChevronLeft className="me-1 h-4 w-4" />
          {d?.previous || "Previous"}
        </Button>

        <div className="flex gap-2">
          {/* Question dots */}
          {exam.questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={`h-3 w-3 rounded-full transition-colors ${
                i === currentIndex
                  ? "bg-primary"
                  : answers[q.id]
                    ? "bg-primary/40"
                    : "bg-muted"
              }`}
              aria-label={`Question ${i + 1}`}
            />
          ))}
        </div>

        {currentIndex === exam.totalQuestions - 1 ? (
          <Button onClick={handleSubmit}>{d?.submit || "Submit"}</Button>
        ) : (
          <Button onClick={() => setCurrentIndex((i) => i + 1)}>
            {d?.next || "Next"}
            <ChevronRight className="ms-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: MockExamData["questions"][0]
  value: string | string[] | undefined
  onChange: (val: string | string[]) => void
}) {
  const selectedValue = typeof value === "string" ? value : value?.[0] || ""

  if (
    question.questionType === "MULTIPLE_CHOICE" ||
    question.questionType === "TRUE_FALSE"
  ) {
    return (
      <RadioGroup value={selectedValue} onValueChange={onChange}>
        {question.options.map((opt) => (
          <div key={opt.id} className="flex items-center space-x-2">
            <RadioGroupItem value={opt.id} id={`${question.id}-${opt.id}`} />
            <Label
              htmlFor={`${question.id}-${opt.id}`}
              className="cursor-pointer"
            >
              {opt.text}
            </Label>
          </div>
        ))}
      </RadioGroup>
    )
  }

  return (
    <Textarea
      value={selectedValue}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type your answer..."
      rows={question.questionType === "ESSAY" ? 8 : 3}
    />
  )
}

function MockExamResults({
  exam,
  results,
  answers,
  dictionary,
  onBack,
}: {
  exam: MockExamData
  results: {
    score: number
    totalPoints: number
    percentage: number
    questions: MockQuestionWithAnswer[]
  }
  answers: Record<string, string | string[]>
  dictionary: Dictionary
  onBack: () => void
}) {
  const d = dictionary?.school?.exams
  const passed = results.percentage >= 50

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Score Summary */}
      <Card className={passed ? "border-green-500/20" : "border-red-500/20"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {passed ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
            {d?.mockResult || "Mock Exam Result"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-8">
            <div>
              <p className="text-muted-foreground text-sm">
                {d?.score || "Score"}
              </p>
              <p className="text-3xl font-bold">
                {results.score}/{results.totalPoints}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">
                {d?.percentage || "Percentage"}
              </p>
              <p className="text-3xl font-bold">{results.percentage}%</p>
            </div>
            <div className="flex items-end">
              <Badge variant={passed ? "default" : "destructive"}>
                {passed ? d?.passed || "Passed" : d?.failed || "Failed"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Review */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          {d?.reviewAnswers || "Review Answers"}
        </h3>
        {results.questions.map((q, idx) => {
          const studentAnswer = answers[q.id]
          const selectedId =
            typeof studentAnswer === "string"
              ? studentAnswer
              : studentAnswer?.[0]

          const isAutoGraded =
            q.questionType === "MULTIPLE_CHOICE" ||
            q.questionType === "TRUE_FALSE" ||
            q.questionType === "FILL_BLANK"

          let isCorrect = false
          if (isAutoGraded && studentAnswer) {
            if (
              q.questionType === "MULTIPLE_CHOICE" ||
              q.questionType === "TRUE_FALSE"
            ) {
              const selectedIds = Array.isArray(studentAnswer)
                ? studentAnswer
                : [studentAnswer]
              isCorrect =
                q.correctOptionIds.length === selectedIds.length &&
                q.correctOptionIds.every((id) => selectedIds.includes(id))
            } else if (q.questionType === "FILL_BLANK") {
              const ans =
                typeof studentAnswer === "string" ? studentAnswer.trim() : ""
              isCorrect =
                !!q.correctAnswer &&
                ans.toLowerCase() === q.correctAnswer.toLowerCase()
            }
          }

          return (
            <Card
              key={q.id}
              className={
                isAutoGraded
                  ? isCorrect
                    ? "border-green-500/20"
                    : "border-red-500/20"
                  : ""
              }
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium">
                    {idx + 1}. {q.questionText}
                  </CardTitle>
                  {isAutoGraded && (
                    <Badge
                      variant={isCorrect ? "default" : "destructive"}
                      className="shrink-0"
                    >
                      {isCorrect ? `+${q.points}` : "0"} / {q.points}
                    </Badge>
                  )}
                  {!isAutoGraded && (
                    <Badge variant="outline" className="shrink-0">
                      {d?.manualReview || "Self-review"}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Show options with correct/incorrect marking */}
                {(q.questionType === "MULTIPLE_CHOICE" ||
                  q.questionType === "TRUE_FALSE") && (
                  <div className="space-y-1">
                    {q.options.map((opt) => {
                      const isSelected = selectedId === opt.id
                      const isOptionCorrect = q.correctOptionIds.includes(
                        opt.id
                      )
                      return (
                        <div
                          key={opt.id}
                          className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ${
                            isOptionCorrect
                              ? "bg-green-50 font-medium text-green-700 dark:bg-green-950/30 dark:text-green-400"
                              : isSelected && !isOptionCorrect
                                ? "bg-red-50 text-red-700 line-through dark:bg-red-950/30 dark:text-red-400"
                                : ""
                          }`}
                        >
                          {isOptionCorrect && (
                            <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-500" />
                          )}
                          {isSelected && !isOptionCorrect && (
                            <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                          )}
                          {!isSelected && !isOptionCorrect && (
                            <span className="h-3.5 w-3.5" />
                          )}
                          {opt.text}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Show student answer for text questions */}
                {q.questionType !== "MULTIPLE_CHOICE" &&
                  q.questionType !== "TRUE_FALSE" &&
                  studentAnswer && (
                    <div>
                      <p className="text-muted-foreground text-xs font-medium">
                        {d?.yourAnswer || "Your Answer"}:
                      </p>
                      <p className="mt-1 text-sm">
                        {typeof studentAnswer === "string"
                          ? studentAnswer
                          : studentAnswer.join(", ")}
                      </p>
                    </div>
                  )}

                {/* Correct answer for fill-in-blank */}
                {q.questionType === "FILL_BLANK" && q.correctAnswer && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-green-600 dark:text-green-400">
                      {d?.correctAnswer || "Correct Answer"}:
                    </p>
                    <p className="text-sm">{q.correctAnswer}</p>
                  </div>
                )}

                {/* Model answer for essay/short answer */}
                {q.sampleAnswer &&
                  (q.questionType === "ESSAY" ||
                    q.questionType === "SHORT_ANSWER") && (
                    <div className="bg-muted/50 mt-2 rounded-md p-3">
                      <p className="text-xs font-medium">
                        {d?.modelAnswer || "Model Answer"}:
                      </p>
                      <p className="mt-1 text-sm">{q.sampleAnswer}</p>
                    </div>
                  )}

                {/* Explanation */}
                {q.explanation && (
                  <div className="mt-2 flex items-start gap-2 text-sm">
                    <AlertCircle className="text-muted-foreground mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <p className="text-muted-foreground">{q.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Button variant="outline" onClick={onBack}>
        {d?.backToMocks || "Back to Mock Exams"}
      </Button>
    </div>
  )
}
