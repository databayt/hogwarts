"use client"

import { ExamErrorBoundary } from "@/components/platform/exams/error-boundary"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function NewExamError({ error, reset }: ErrorProps) {
  return (
    <ExamErrorBoundary
      error={error}
      reset={reset}
      title="Unable to load Exam Form"
      description="An error occurred while loading the exam creation form. Please try again."
    />
  )
}
