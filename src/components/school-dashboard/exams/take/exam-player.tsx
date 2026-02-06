"use client"

/**
 * Exam Player Component
 *
 * Main exam-taking interface with:
 * - Proctoring integration
 * - Question navigation
 * - Timer with auto-submit
 * - Answer persistence
 * - Multiple question type support
 *
 * This component wraps the existing exam taking UI with proctoring features.
 */
import * as React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flag,
  Save,
  Send,
  Shield,
  ShieldAlert,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { useExamSession, useProctor } from "./hooks"
import { ProctorGuard } from "./proctor-guard"
import { QuestionNav } from "./question-nav"
import { ExamTimer } from "./timer"
import type {
  AnswerState,
  ExamData,
  ExamQuestion,
  ExamSessionData,
  ExistingAnswer,
  QuestionOption,
} from "./types"

interface ExamPlayerProps {
  exam: ExamData
  questions: ExamQuestion[]
  existingAnswers: ExistingAnswer[]
  initialSession: ExamSessionData | null
  locale: string
}

export function ExamPlayer({
  exam,
  questions,
  existingAnswers,
  initialSession,
  locale,
}: ExamPlayerProps) {
  const router = useRouter()
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [showTimeWarning, setShowTimeWarning] = useState(false)
  const [showSecurityWarning, setShowSecurityWarning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(
    new Set()
  )

  // Initialize answers from existing answers
  const initialAnswers = useMemo(() => {
    const map = new Map<string, AnswerState>()
    existingAnswers.forEach((ans) => {
      map.set(ans.questionId, {
        answerText: ans.answerText || undefined,
        selectedOptionIds: ans.selectedOptionIds,
      })
    })
    return map
  }, [existingAnswers])

  // Exam session hook
  const {
    session,
    answers,
    isLoading,
    isSaving,
    isSubmitting,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    startSession,
    updateAnswer,
    saveAnswers,
    submitExam,
    getAnsweredIndices,
  } = useExamSession({
    examId: exam.id,
    session: initialSession,
    initialAnswers,
    autoSaveInterval: 30000, // 30 seconds
    onAutoSave: () => {
      // Could show a toast here
    },
    onSubmit: () => {
      router.push(`/${locale}/exams/${exam.id}`)
    },
    onError: setError,
  })

  // Proctor hook
  const {
    stats: proctorStats,
    handleEvent: handleProctorEvent,
    isMonitoringActive,
    isStrictMode,
  } = useProctor({
    sessionId: session?.id || null,
    mode: exam.proctorMode,
    maxWarnings: 10,
    onMaxWarningsReached: () => {
      setShowSecurityWarning(true)
    },
  })

  // Start session on mount if needed
  useEffect(() => {
    if (!session && exam.status === "IN_PROGRESS") {
      startSession()
    }
  }, [session, exam.status, startSession])

  // Get current question
  const currentQuestion = questions[currentQuestionIndex]
  const totalQuestions = questions.length

  // Calculate answered indices
  const answeredIndices = useMemo(() => {
    return getAnsweredIndices(questions.map((q) => q.questionId))
  }, [getAnsweredIndices, questions])

  // Progress percentage
  const progress = (answeredIndices.size / totalQuestions) * 100

  // Handle answer change
  const handleAnswerChange = useCallback(
    (questionId: string, value: AnswerState) => {
      updateAnswer(questionId, value)
    },
    [updateAnswer]
  )

  // Handle time up
  const handleTimeUp = useCallback(async () => {
    await submitExam()
  }, [submitExam])

  // Handle submit
  const handleSubmit = async () => {
    const result = await submitExam()
    if (result.success) {
      setShowSubmitDialog(false)
    }
  }

  // Navigate to question
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentQuestionIndex(index)
    }
  }

  // Toggle flag for current question
  const toggleFlag = () => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev)
      if (next.has(currentQuestionIndex)) {
        next.delete(currentQuestionIndex)
      } else {
        next.add(currentQuestionIndex)
      }
      return next
    })
  }

  // Render question input based on type
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
        return (
          <p className="text-muted-foreground">Unsupported question type</p>
        )
    }
  }

  // MCQ renderer
  const renderMCQ = (
    question: ExamQuestion["question"],
    answer?: AnswerState
  ) => {
    const options = (question.options || []) as QuestionOption[]
    const isSingleSelect = options.filter((o) => o.isCorrect).length <= 1

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
                className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border p-3"
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
              className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border p-3"
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

  // True/False renderer
  const renderTrueFalse = (
    question: ExamQuestion["question"],
    answer?: AnswerState
  ) => {
    return (
      <RadioGroup
        value={answer?.selectedOptionIds?.[0] || ""}
        onValueChange={(value) =>
          handleAnswerChange(question.id, { selectedOptionIds: [value] })
        }
      >
        <div className="space-y-3">
          <div className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border p-4">
            <RadioGroupItem value="true" id="true" />
            <Label htmlFor="true" className="flex-1 cursor-pointer text-lg">
              True
            </Label>
          </div>
          <div className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border p-4">
            <RadioGroupItem value="false" id="false" />
            <Label htmlFor="false" className="flex-1 cursor-pointer text-lg">
              False
            </Label>
          </div>
        </div>
      </RadioGroup>
    )
  }

  // Fill in the blank renderer
  const renderFillBlank = (
    question: ExamQuestion["question"],
    answer?: AnswerState
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

  // Short answer renderer
  const renderShortAnswer = (
    question: ExamQuestion["question"],
    answer?: AnswerState
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

  // Essay renderer
  const renderEssay = (
    question: ExamQuestion["question"],
    answer?: AnswerState
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-muted-foreground mt-4">Starting exam session...</p>
        </div>
      </div>
    )
  }

  return (
    <ProctorGuard
      mode={exam.proctorMode}
      onFlag={handleProctorEvent}
      className="bg-background min-h-screen"
    >
      {/* Header with Timer */}
      <div className="bg-background sticky top-0 z-50 border-b px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold">{exam.title}</h1>
              {isMonitoringActive && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="gap-1">
                        <Shield className="h-3 w-3" />
                        {isStrictMode ? "Proctored" : "Monitored"}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {isStrictMode
                          ? "Strict proctoring is active. Suspicious activity is being monitored."
                          : "Activity is being monitored."}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Saving indicator */}
            {isSaving && (
              <Badge variant="secondary" className="gap-1">
                <Save className="h-3 w-3 animate-pulse" />
                Saving...
              </Badge>
            )}

            {/* Timer */}
            <ExamTimer
              duration={exam.duration}
              startedAt={
                session?.startedAt ? new Date(session.startedAt) : null
              }
              onTimeUp={handleTimeUp}
              onWarning={() => setShowTimeWarning(true)}
            />

            {/* Submit button */}
            <Button
              onClick={() => setShowSubmitDialog(true)}
              disabled={isSubmitting}
            >
              <Send className="me-2 h-4 w-4" />
              Submit
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="container mx-auto mt-2">
          <div className="flex items-center gap-2">
            <Progress value={progress} className="flex-1" />
            <span className="text-muted-foreground text-sm">
              {answeredIndices.size}/{totalQuestions} answered
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Question navigation sidebar */}
          <div className="order-2 lg:order-1 lg:col-span-1">
            <QuestionNav
              totalQuestions={totalQuestions}
              currentIndex={currentQuestionIndex}
              answeredIndices={answeredIndices}
              flaggedIndices={flaggedQuestions}
              onSelect={goToQuestion}
            />
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
                      <div className="flex flex-wrap items-center gap-2">
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

                    <div className="flex items-center gap-2">
                      {/* Flag button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleFlag}
                        className={cn(
                          flaggedQuestions.has(currentQuestionIndex) &&
                            "text-yellow-500"
                        )}
                      >
                        <Flag
                          className={cn(
                            "h-4 w-4",
                            flaggedQuestions.has(currentQuestionIndex) &&
                              "fill-current"
                          )}
                        />
                      </Button>

                      {/* Answered indicator */}
                      {answeredIndices.has(currentQuestionIndex) && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                    </div>
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
                      <ChevronLeft className="me-2 h-4 w-4" />
                      Previous
                    </Button>

                    <Button
                      onClick={() => goToQuestion(currentQuestionIndex + 1)}
                      disabled={currentQuestionIndex === totalQuestions - 1}
                    >
                      Next
                      <ChevronRight className="ms-2 h-4 w-4" />
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

      {/* Security warning dialog */}
      <AlertDialog
        open={showSecurityWarning}
        onOpenChange={setShowSecurityWarning}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="text-destructive h-5 w-5" />
              Security Warning
            </AlertDialogTitle>
            <AlertDialogDescription>
              Multiple suspicious activities have been detected during this exam
              session. Your activity is being logged and may be reviewed by your
              instructor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>I Understand</AlertDialogAction>
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
                You have answered {answeredIndices.size} out of {totalQuestions}{" "}
                questions.
              </p>
              {answeredIndices.size < totalQuestions && (
                <p className="text-yellow-600 dark:text-yellow-400">
                  Warning: {totalQuestions - answeredIndices.size} questions are
                  unanswered.
                </p>
              )}
              {flaggedQuestions.size > 0 && (
                <p className="text-yellow-600 dark:text-yellow-400">
                  You have {flaggedQuestions.size} flagged question(s) for
                  review.
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
    </ProctorGuard>
  )
}
