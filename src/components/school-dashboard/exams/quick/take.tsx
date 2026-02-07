"use client"

import { useEffect, useState } from "react"
import { CheckCircle, Clock, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"

interface QuestionData {
  id: string
  questionText: string
  questionType: string
  options: { text: string; isCorrect?: boolean }[] | null
}

interface QuickAssessmentTakeProps {
  assessmentId: string
}

export function QuickAssessmentTake({
  assessmentId,
}: QuickAssessmentTakeProps) {
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
      // Silently handle - student can retry
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
        <h2 className="text-xl font-semibold">Assessment Not Available</h2>
        <p className="text-muted-foreground text-sm">
          This assessment is no longer active.
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
        <h2 className="text-xl font-semibold">Submitted!</h2>
        <p className="text-muted-foreground text-sm">
          Thank you for completing this assessment.
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
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{assessment.title}</h2>
          <p className="text-muted-foreground text-sm capitalize">
            {assessment.type.replace("_", " ").toLowerCase()}
          </p>
        </div>
        {timeLeft !== null && (
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
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
              <CardTitle className="text-base">
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
                    <div key={oi} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={String(oi)}
                        id={`q${q.id}-o${oi}`}
                      />
                      <Label htmlFor={`q${q.id}-o${oi}`}>{opt.text}</Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <Textarea
                  placeholder="Type your answer..."
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

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit"
          )}
        </Button>
      </div>
    </div>
  )
}
