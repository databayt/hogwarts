"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"
import { CheckCircle, Clock, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import {
  useDictionary,
  useDictionaryFallback,
} from "@/components/internationalization/use-dictionary"

const TYPE_KEYS: Record<string, string> = {
  EXIT_TICKET: "exitTicket",
  POLL: "poll",
  WARM_UP: "warmUp",
  CHECK_IN: "checkIn",
}

interface QuestionData {
  id: string
  questionText: string
  questionType: string
  options: { text: string }[] | null
}

interface QuickAssessmentTakeProps {
  assessmentId: string
}

export function QuickAssessmentTake({
  assessmentId,
}: QuickAssessmentTakeProps) {
  const { dictionary } = useDictionary()
  const dict = useDictionaryFallback(dictionary)
  const t = dictionary?.school?.exams?.quick?.take
  // New keys live in the `exams` namespace (not in the TS types yet)
  const x = (dict as any)?.exams?.quick ?? {}
  const xt = x.take ?? {}
  const typeLabels = (dictionary?.school?.exams?.quick?.form?.types ??
    {}) as Record<string, string>
  const [submitError, setSubmitError] = useState(false)

  const [assessment, setAssessment] = useState<{
    id: string
    title: string
    type: string
    duration: number
    isAnonymous: boolean
    showResults: boolean
    status: string
    questions: QuestionData[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { getQuickAssessment } = await import("./actions")
        const result = await getQuickAssessment(assessmentId)
        if (result) {
          setAssessment(result as any)
          setTimeLeft(result.duration * 60)
        }
      } catch {
        // Error handled by empty assessment state
      }
      setLoading(false)
    }
    load()
  }, [assessmentId])

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitted) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft, submitted])

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !submitted && !submitting) {
      handleSubmit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, submitted, submitting])

  async function handleSubmit() {
    if (submitting || submitted) return
    setSubmitting(true)
    setSubmitError(false)
    try {
      const { submitQuickResponse } = await import("./actions")
      const responses = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }))
      await submitQuickResponse({
        assessmentId,
        responses,
      })
      setSubmitted(true)
    } catch {
      // Student can retry
      setSubmitError(true)
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!assessment || assessment.status !== "ACTIVE") {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold">{t?.notAvailable ?? ""}</h2>
        <p className="text-muted-foreground text-sm">
          {t?.notAvailableDescription ?? ""}
        </p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <div className="rounded-full bg-green-100 p-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold">{t?.submitted ?? ""}</h2>
        <p className="text-muted-foreground text-sm">
          {t?.submittedDescription ?? ""}
        </p>
      </div>
    )
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  return (
    <div className="mx-auto w-full max-w-2xl min-w-0 space-y-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold break-words">{assessment.title}</h2>
          <p className="text-muted-foreground text-sm">
            {typeLabels[TYPE_KEYS[assessment.type]] ?? ""}
          </p>
        </div>
        {timeLeft !== null && (
          <div
            className="flex items-center gap-2 rounded-lg border px-3 py-2"
            role="timer"
            aria-label={xt.timeRemaining ?? ""}
          >
            <Clock className="h-4 w-4" />
            <span className="font-mono text-sm font-medium">
              {formatTime(timeLeft)}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {assessment.questions.map((q, index) => (
          <Card key={q.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base break-words">
                {index + 1}. {q.questionText}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {q.questionType === "MULTIPLE_CHOICE" ||
              q.questionType === "TRUE_FALSE" ? (
                <RadioGroup
                  value={answers[q.id] || ""}
                  onValueChange={(value) =>
                    setAnswers((prev) => ({ ...prev, [q.id]: value }))
                  }
                >
                  {(q.options || []).map((opt, oi) => (
                    <div
                      key={oi}
                      className="flex min-h-11 min-w-0 items-center gap-2"
                    >
                      <RadioGroupItem
                        value={String(oi)}
                        id={`q${q.id}-o${oi}`}
                      />
                      <Label
                        htmlFor={`q${q.id}-o${oi}`}
                        className="min-h-11 min-w-0 flex-1 items-center leading-6 break-words"
                      >
                        {opt.text}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <Textarea
                  placeholder={t?.answerPlaceholder ?? ""}
                  value={answers[q.id] || ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                  rows={3}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {submitError && (
        <p role="alert" className="text-destructive text-sm">
          {xt.submitFailed ?? ""}
        </p>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="min-h-11 max-sm:w-full"
        >
          {submitting ? (
            <>
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              {t?.submitting ?? ""}
            </>
          ) : (
            (dictionary?.school?.exams?.submit ?? "")
          )}
        </Button>
      </div>
    </div>
  )
}
