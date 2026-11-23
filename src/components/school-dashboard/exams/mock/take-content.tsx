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
import {
  useDictionary,
  useDictionaryFallback,
} from "@/components/internationalization/use-dictionary"

import type { MockExamData, MockQuestionWithAnswer } from "./take-actions"
import { submitMockExam } from "./take-actions"

interface MockExamTakingProps {
  exam: MockExamData
  dictionary?: Dictionary
}

type Phase = "taking" | "submitting" | "results"

export function MockExamTaking({
  exam,
  dictionary: dictionaryProp,
}: MockExamTakingProps) {
  const dictionary = useDictionaryFallback(dictionaryProp)
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
  // New keys live in the `exams` namespace (not in the TS types yet)
  const x = (dictionary as any)?.exams?.mock?.take ?? {}
  const [submitError, setSubmitError] = useState(false)

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
    setSubmitError(false)
    setPhase("submitting")
    const result = await submitMockExam({
      catalogExamId: exam.id,
      answers,
    })

    if (result.success && result.data) {
      setResults(result.data)
      setPhase("results")
    } else {
      setSubmitError(true)
      setPhase("taking")
    }
  }, [exam.id, answers])

  if (phase === "submitting") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
          <p className="text-muted-foreground mt-4">{d?.submitting || ""}</p>
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
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold break-words">{exam.title}</h2>
          <p className="text-muted-foreground text-sm">
            {exam.name} &middot; {d?.mockExam || ""}
          </p>
        </div>
        {timeLeft !== null && (
          <Badge
            variant={timeLeft < 300 ? "destructive" : "secondary"}
            className="gap-1 text-base"
            role="timer"
            aria-label={x.timeRemaining ?? ""}
          >
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </Badge>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex flex-wrap justify-between gap-x-3 text-sm">
          <span>
            {d?.question || ""} {currentIndex + 1}/{exam.totalQuestions}
          </span>
          <span>
            {answeredCount}/{exam.totalQuestions} {d?.answered || ""}
          </span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <CardTitle className="min-w-0 flex-1 text-base break-words">
                {currentIndex + 1}. {currentQuestion.questionText}
              </CardTitle>
              <Badge variant="outline" className="shrink-0">
                {(x.points ?? "").replace(
                  "{count}",
                  String(currentQuestion.points)
                )}
              </Badge>
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

      {submitError && (
        <p role="alert" className="text-destructive text-sm">
          {x.submitFailed ?? ""}
        </p>
      )}

      {/* Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          className="min-h-11"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => i - 1)}
        >
          <ChevronLeft className="me-1 h-4 w-4 rtl:rotate-180" />
          {d?.previous || ""}
        </Button>

        <div className="order-last flex w-full flex-wrap justify-center gap-1 sm:order-none sm:w-auto">
          {/* Question dots */}
          {exam.questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              type="button"
              className="flex size-11 items-center justify-center rounded-full sm:size-6"
              aria-label={`${d?.question ?? ""} ${i + 1}`}
              aria-current={i === currentIndex ? "step" : undefined}
            >
              <span
                className={`h-3 w-3 rounded-full transition-colors ${
                  i === currentIndex
                    ? "bg-primary"
                    : answers[q.id]
                      ? "bg-primary/40"
                      : "bg-muted"
                }`}
              />
            </button>
          ))}
        </div>

        {currentIndex === exam.totalQuestions - 1 ? (
          <Button className="min-h-11" onClick={handleSubmit}>
            {d?.submit || ""}
          </Button>
        ) : (
          <Button
            className="min-h-11"
            onClick={() => setCurrentIndex((i) => i + 1)}
          >
            {d?.next || ""}
            <ChevronRight className="ms-1 h-4 w-4 rtl:rotate-180" />
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
  const { dictionary: qDict } = useDictionary()
  const selectedValue = typeof value === "string" ? value : value?.[0] || ""

  if (
    question.questionType === "MULTIPLE_CHOICE" ||
    question.questionType === "TRUE_FALSE"
  ) {
    return (
      <RadioGroup value={selectedValue} onValueChange={onChange}>
        {question.options.map((opt) => (
          <div
            key={opt.id}
            className="flex min-h-11 min-w-0 items-center gap-2"
          >
            <RadioGroupItem value={opt.id} id={`${question.id}-${opt.id}`} />
            <Label
              htmlFor={`${question.id}-${opt.id}`}
              className="min-h-11 min-w-0 flex-1 cursor-pointer leading-6 break-words"
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
      placeholder={qDict?.school?.exams?.typeAnswer ?? ""}
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
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-6">
      {/* Score Summary */}
      <Card className={passed ? "border-green-500/20" : "border-red-500/20"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {passed ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
            {d?.mockResult || ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <div>
              <p className="text-muted-foreground text-sm">{d?.score || ""}</p>
              <p className="text-3xl font-bold">
                {results.score}/{results.totalPoints}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">
                {d?.percentage || ""}
              </p>
              <p className="text-3xl font-bold">{results.percentage}%</p>
            </div>
            <div className="flex items-end">
              <Badge variant={passed ? "default" : "destructive"}>
                {passed ? d?.passed || "" : d?.failed || ""}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Review */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{d?.reviewAnswers || ""}</h3>
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
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="min-w-0 text-sm font-medium break-words">
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
                      {d?.manualReview || ""}
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
                          className={`flex min-w-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm break-words ${
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
                        {d?.yourAnswer || ""}:
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
                      {d?.correctAnswer || ""}:
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
                        {d?.modelAnswer || ""}:
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

      <Button variant="outline" className="min-h-11" onClick={onBack}>
        {d?.backToMocks || ""}
      </Button>
    </div>
  )
}
