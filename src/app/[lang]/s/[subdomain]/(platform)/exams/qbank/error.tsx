"use client"

import { ExamErrorBoundary } from "@/components/platform/exams/error-boundary"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function QBankError({ error, reset }: ErrorProps) {
  return (
    <ExamErrorBoundary
      error={error}
      reset={reset}
      title="Unable to load Question Bank"
      description="An error occurred while loading the question bank. Please try again."
    />
  )
}
