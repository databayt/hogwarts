"use client"

import { ExamErrorBoundary } from "@/components/platform/exams/error-boundary"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ResultError({ error, reset }: ErrorProps) {
  return (
    <ExamErrorBoundary
      error={error}
      reset={reset}
      title="Unable to load Results"
      description="An error occurred while loading exam results. Please try again."
    />
  )
}
