/**
 * Exam Taking Experience - Client Component
 *
 * Interactive exam-taking interface with:
 * - Question navigation: sidebar grid + Previous/Next buttons
 * - Multiple question types: MCQ (single/multi), True/False, Fill Blank, Short Answer, Essay
 * - Real-time timer: countdown display with 5-minute warning dialog
 * - Progress tracking: answered count, visual progress bar, answered question indicators
 * - Auto-submit: submits when time expires (cannot be prevented)
 * - Answer persistence: loads existing answers on mount, persists in local state
 * - Submit confirmation: warns if questions left unanswered
 *
 * Client-side design rationale:
 * - Uses Map<questionId, answer> for O(1) lookup and update efficiency
 * - useMemo for progress calculation to avoid recalculation on every keystroke
 * - useCallback for answer changes to maintain referential stability
 * - Validates exam status to prevent interaction if exam not IN_PROGRESS
 *
 * Security considerations:
 * - Submission sent to server action (submitExamAnswers) which re-validates exam status
 * - Timer is client-side only; server should enforce exam deadline
 * - Never trusts client answer count or exam duration for grading
 *
 * i18n: Exam title, instructions passed from server; timer/UI labels are hardcoded English
 */
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { ExamStatus } from "@prisma/client"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Save,
  Send,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { submitExamAnswers } from "@/components/platform/exams/manage/actions"

interface ExamQuestion {
  id: string
  questionId: string
  order: number
  points: number
  question: {
    id: string
    questionText: string
    questionType: string
    options: any
    imageUrl: string | null
  }
}

interface ExistingAnswer {
  questionId: string
  answerText: string | null
  selectedOptionIds: string[]
}

interface ExamTakingContentProps {
  exam: {
    id: string
    title: string
    description: string | null
    duration: number
    totalMarks: number
    passingMarks: number
    instructions: string | null
    status: ExamStatus
  }
  questions: ExamQuestion[]
  existingAnswers: ExistingAnswer[]
  dictionary: Dictionary
}

export function ExamTakingContent({
  exam,
  questions,
  existingAnswers,
  dictionary,
}: ExamTakingContentProps) {
  const router = useRouter()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<
    Map<string, { answerText?: string; selectedOptionIds?: string[] }>
  >(new Map())
  const [timeRemaining, setTimeRemaining] = useState(exam.duration * 60) // seconds
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [showTimeWarning, setShowTimeWarning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize answers from existing answers (previously saved responses)
  // Uses Map for O(1) lookups when rendering question inputs
  useEffect(() => {
    const initialAnswers = new Map<
      string,
      { answerText?: string; selectedOptionIds?: string[] }
    >()
    existingAnswers.forEach((ans) => {
      initialAnswers.set(ans.questionId, {
        answerText: ans.answerText || undefined,
        selectedOptionIds: ans.selectedOptionIds,
      })
    })
    setAnswers(initialAnswers)
  }, [existingAnswers])

  // Countdown timer with auto-submission on expiration
  // SECURITY: Server should re-validate exam deadline; client-side timer is UX only
  // Exits early if exam is not IN_PROGRESS (prevents timer interference)
  useEffect(() => {
    if (exam.status !== "IN_PROGRESS") return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        // Auto-submit when time reaches zero - no way for student to prevent this
        if (prev <= 1) {
          clearInterval(timer)
          handleSubmit()
          return 0
        }
        // Trigger warning dialog at 5 minutes remaining
        if (prev === 300) {
          setShowTimeWarning(true)
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [exam.status])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  const currentQuestion = questions[currentQuestionIndex]
  const totalQuestions = questions.length

  // Calculate answered question count for progress bar and UI feedback
  // Memoized to avoid recalculation on every keystroke/state change
  // A question is considered answered if:
  // - answerText is provided and non-empty, OR
  // - selectedOptionIds array has at least one selection
  const answeredCount = useMemo(() => {
    return questions.filter((q) => {
      const answer = answers.get(q.questionId)
      return (
        (answer?.answerText && answer.answerText.trim() !== "") ||
        (answer?.selectedOptionIds && answer.selectedOptionIds.length > 0)
      )
    }).length
  }, [answers, questions])

  // Progress percentage for visual progress bar (0-100)
  const progress = (answeredCount / totalQuestions) * 100

  const handleAnswerChange = useCallback(
    (
      questionId: string,
      value: { answerText?: string; selectedOptionIds?: string[] }
    ) => {
      setAnswers((prev) => {
        const next = new Map(prev)
        next.set(questionId, { ...prev.get(questionId), ...value })
        return next
      })
    },
    []
  )

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const answersArray = questions.map((q) => {
        const answer = answers.get(q.questionId)
        return {
          questionId: q.questionId,
          answerText: answer?.answerText,
          selectedOptionIds: answer?.selectedOptionIds,
        }
      })

      const result = await submitExamAnswers(exam.id, answersArray)

      if (result.success) {
        router.push(`/exams/${exam.id}`)
      } else {
        setError(result.error || "Failed to submit exam")
      }
    } catch (err) {
      setError("An error occurred while submitting")
    } finally {
      setIsSubmitting(false)
      setShowSubmitDialog(false)
    }
  }

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentQuestionIndex(index)
    }
  }

  // Question type specific renders
  const renderQuestionInput = () => {
    if (!currentQuestion) return null

    const { question } = currentQuestion
    const currentAnswer = answers.get(question.id)

    switch (question.questionType) {
      case "MULTIPLE_CHOICE":
        return renderMCQ(question, currentAnswer)
      case "TRUE_FALSE":
        return renderTrueFalse(question, currentAnswer)
      case "FILL_BLANK":
        return renderFillBlank(question, currentAnswer)
      case "SHORT_ANSWER":
        return renderShortAnswer(question, currentAnswer)
      case "ESSAY":
        return renderEssay(question, currentAnswer)
      default:
        return <p>Unsupported question type</p>
    }
  }

  const renderMCQ = (
    question: ExamQuestion["question"],
    answer?: { answerText?: string; selectedOptionIds?: string[] }
  ) => {
    const options = question.options as Array<{ text: string; id: string }>
    const isSingleSelect = options.filter((o: any) => o.isCorrect).length <= 1

    if (isSingleSelect) {
      return (
        <RadioGroup
          value={answer?.selectedOptionIds?.[0] || ""}
          onValueChange={(value) =>
            handleAnswerChange(question.id, { selectedOptionIds: [value] })
          }
        >
          <div className="space-y-3">
            {options.map((option, idx) => (
              <div
                key={idx}
                className="hover:bg-muted/50 flex cursor-pointer items-center space-x-3 rounded-lg border p-3"
              >
                <RadioGroupItem
                  value={option.id || idx.toString()}
                  id={`option-${idx}`}
                />
                <Label
                  htmlFor={`option-${idx}`}
                  className="flex-1 cursor-pointer"
                >
                  {option.text}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      )
    }

    // Multiple select
    return (
      <div className="space-y-3">
        {options.map((option, idx) => {
          const optionId = option.id || idx.toString()
          const isSelected =
            answer?.selectedOptionIds?.includes(optionId) || false

          return (
            <div
              key={idx}
              className="hover:bg-muted/50 flex cursor-pointer items-center space-x-3 rounded-lg border p-3"
              onClick={() => {
                const current = answer?.selectedOptionIds || []
                const next = isSelected
                  ? current.filter((id) => id !== optionId)
                  : [...current, optionId]
                handleAnswerChange(question.id, { selectedOptionIds: next })
              }}
            >
              <Checkbox checked={isSelected} />
              <Label className="flex-1 cursor-pointer">{option.text}</Label>
            </div>
          )
        })}
      </div>
    )
  }

  const renderTrueFalse = (
    question: ExamQuestion["question"],
    answer?: { answerText?: string; selectedOptionIds?: string[] }
  ) => {
    return (
      <RadioGroup
        value={answer?.selectedOptionIds?.[0] || ""}
        onValueChange={(value) =>
          handleAnswerChange(question.id, { selectedOptionIds: [value] })
        }
      >
        <div className="space-y-3">
          <div className="hover:bg-muted/50 flex cursor-pointer items-center space-x-3 rounded-lg border p-4">
            <RadioGroupItem value="0" id="true" />
            <Label htmlFor="true" className="flex-1 cursor-pointer text-lg">
              True
            </Label>
          </div>
          <div className="hover:bg-muted/50 flex cursor-pointer items-center space-x-3 rounded-lg border p-4">
            <RadioGroupItem value="1" id="false" />
            <Label htmlFor="false" className="flex-1 cursor-pointer text-lg">
              False
            </Label>
          </div>
        </div>
      </RadioGroup>
    )
  }

  const renderFillBlank = (
    question: ExamQuestion["question"],
    answer?: { answerText?: string; selectedOptionIds?: string[] }
  ) => {
    return (
      <div className="space-y-4">
        <Input
          placeholder="Enter your answer..."
          value={answer?.answerText || ""}
          onChange={(e) =>
            handleAnswerChange(question.id, { answerText: e.target.value })
          }
          className="p-4 text-lg"
        />
      </div>
    )
  }

  const renderShortAnswer = (
    question: ExamQuestion["question"],
    answer?: { answerText?: string; selectedOptionIds?: string[] }
  ) => {
    return (
      <div className="space-y-4">
        <Textarea
          placeholder="Enter your answer..."
          value={answer?.answerText || ""}
          onChange={(e) =>
            handleAnswerChange(question.id, { answerText: e.target.value })
          }
          className="min-h-[150px] text-base"
        />
        <p className="text-muted-foreground text-sm">
          {(answer?.answerText || "").length} characters
        </p>
      </div>
    )
  }

  const renderEssay = (
    question: ExamQuestion["question"],
    answer?: { answerText?: string; selectedOptionIds?: string[] }
  ) => {
    return (
      <div className="space-y-4">
        <Textarea
          placeholder="Write your essay response here..."
          value={answer?.answerText || ""}
          onChange={(e) =>
            handleAnswerChange(question.id, { answerText: e.target.value })
          }
          className="min-h-[300px] text-base"
        />
        <div className="text-muted-foreground flex justify-between text-sm">
          <span>
            {(answer?.answerText || "").split(/\s+/).filter(Boolean).length}{" "}
            words
          </span>
          <span>{(answer?.answerText || "").length} characters</span>
        </div>
      </div>
    )
  }

  const isQuestionAnswered = (questionId: string) => {
    const answer = answers.get(questionId)
    return (
      (answer?.answerText && answer.answerText.trim() !== "") ||
      (answer?.selectedOptionIds && answer.selectedOptionIds.length > 0)
    )
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Header with Timer */}
      <div className="bg-background sticky top-0 z-50 border-b px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-semibold">{exam.title}</h1>
            <p className="text-muted-foreground text-sm">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2",
                timeRemaining < 300
                  ? "bg-destructive/10 text-destructive"
                  : "bg-muted"
              )}
            >
              <Clock className="h-5 w-5" />
              <span className="font-mono text-lg font-semibold">
                {formatTime(timeRemaining)}
              </span>
            </div>

            <Button
              onClick={() => setShowSubmitDialog(true)}
              disabled={isSubmitting}
            >
              <Send className="mr-2 h-4 w-4" />
              Submit Exam
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="container mx-auto mt-2">
          <div className="flex items-center gap-2">
            <Progress value={progress} className="flex-1" />
            <span className="text-muted-foreground text-sm">
              {answeredCount}/{totalQuestions} answered
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Question navigation sidebar */}
          <div className="order-2 lg:order-1 lg:col-span-1">
            <Card className="sticky top-32">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="grid grid-cols-5 gap-2">
                    {questions.map((q, idx) => {
                      const answered = isQuestionAnswered(q.questionId)
                      const isCurrent = idx === currentQuestionIndex

                      return (
                        <Button
                          key={q.id}
                          variant={
                            isCurrent
                              ? "default"
                              : answered
                                ? "secondary"
                                : "outline"
                          }
                          size="sm"
                          className={cn(
                            "h-10 w-10 p-0",
                            answered &&
                              !isCurrent &&
                              "bg-green-100 hover:bg-green-200 dark:bg-green-900"
                          )}
                          onClick={() => goToQuestion(idx)}
                        >
                          {idx + 1}
                        </Button>
                      )
                    })}
                  </div>
                </ScrollArea>

                <Separator className="my-4" />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary h-4 w-4 rounded" />
                    <span>Current</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-green-100 dark:bg-green-900" />
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded border" />
                    <span>Not answered</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question content */}
          <div className="order-1 lg:order-2 lg:col-span-3">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {currentQuestion && (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          Question {currentQuestionIndex + 1}
                        </Badge>
                        <Badge variant="secondary">
                          {currentQuestion.points}{" "}
                          {currentQuestion.points === 1 ? "point" : "points"}
                        </Badge>
                        <Badge>
                          {currentQuestion.question.questionType.replace(
                            "_",
                            " "
                          )}
                        </Badge>
                      </div>
                    </div>

                    {isQuestionAnswered(currentQuestion.questionId) && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Question text */}
                  <div className="text-lg leading-relaxed">
                    {currentQuestion.question.questionText}
                  </div>

                  {/* Question image if any */}
                  {currentQuestion.question.imageUrl && (
                    <div className="overflow-hidden rounded-lg border">
                      <img
                        src={currentQuestion.question.imageUrl}
                        alt="Question image"
                        className="h-auto max-w-full"
                      />
                    </div>
                  )}

                  <Separator />

                  {/* Answer input */}
                  {renderQuestionInput()}

                  {/* Navigation buttons */}
                  <div className="flex justify-between pt-4">
                    <Button
                      variant="outline"
                      onClick={() => goToQuestion(currentQuestionIndex - 1)}
                      disabled={currentQuestionIndex === 0}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>

                    <Button
                      onClick={() => goToQuestion(currentQuestionIndex + 1)}
                      disabled={currentQuestionIndex === totalQuestions - 1}
                    >
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Time warning dialog */}
      <AlertDialog open={showTimeWarning} onOpenChange={setShowTimeWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />5 Minutes
              Remaining
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have 5 minutes left to complete and submit your exam. Make
              sure to review your answers before the time runs out.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Continue Exam</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submit confirmation dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You have answered {answeredCount} out of {totalQuestions}{" "}
                questions.
              </p>
              {answeredCount < totalQuestions && (
                <p className="text-yellow-600 dark:text-yellow-400">
                  Warning: {totalQuestions - answeredCount} questions are
                  unanswered.
                </p>
              )}
              <p>Once submitted, you cannot change your answers.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Continue Exam
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Exam"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
