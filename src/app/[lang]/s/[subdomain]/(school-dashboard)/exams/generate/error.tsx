"use client"

import { ExamErrorBoundary } from "@/components/school-dashboard/exams/error-boundary"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GenerateError({ error, reset }: ErrorProps) {
  return (
    <ExamErrorBoundary
      error={error}
      reset={reset}
      title="Unable to load Exam Generator"
      description="An error occurred while loading the exam generation tools. Please try again."
    />
  )
}
