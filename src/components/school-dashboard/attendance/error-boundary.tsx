"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { Component, ReactNode } from "react"
import { CircleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useDictionary } from "@/components/internationalization/use-dictionary"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class AttendanceErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Attendance Error Boundary caught error:", error, errorInfo)

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    })

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log to error tracking service (e.g., Sentry)
    if (typeof window !== "undefined" && (window as any).Sentry) {
      ;(window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      })
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      return (
        <BoundaryFallback
          message={this.state.error?.message}
          stack={this.state.errorInfo?.componentStack ?? undefined}
          onReset={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}

// Simplified wrapper for common use
export function withAttendanceErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return (props: P) => (
    <AttendanceErrorBoundary fallback={fallback}>
      <Component {...props} />
    </AttendanceErrorBoundary>
  )
}

// Hook for error handling (React 18+)
export function useAttendanceErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  const resetError = () => setError(null)
  const captureError = (error: Error) => setError(error)

  return { captureError, resetError }
}

/** The translated default fallback (a class component can't read hooks). */
function BoundaryFallback({
  message,
  stack,
  onReset,
}: {
  message?: string
  stack?: string
  onReset: () => void
}) {
  const { dictionary } = useDictionary()
  const t = ((
    dictionary as
      | { attendanceToday?: { shell?: Record<string, string> } }
      | undefined
  )?.attendanceToday?.shell ?? {}) as Record<string, string>

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 p-8 text-center">
      <CircleAlert className="text-muted-foreground size-8" />
      <div className="max-w-sm space-y-2">
        <h2 className="text-lg font-semibold">
          {t.errorTitle ?? "Something went wrong"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t.errorDescription ?? "This part of the page couldn't load."}
        </p>
        {process.env.NODE_ENV === "development" && message ? (
          <p className="text-muted-foreground font-mono text-xs" dir="ltr">
            {message}
          </p>
        ) : null}
      </div>
      {process.env.NODE_ENV === "development" && stack ? (
        <details className="w-full max-w-lg rounded-lg border p-3 text-start">
          <summary className="cursor-pointer text-sm font-medium">
            {t.devStack ?? "Component stack (development only)"}
          </summary>
          <pre className="mt-2 overflow-x-auto text-xs" dir="ltr">
            {stack}
          </pre>
        </details>
      ) : null}
      <div className="flex gap-3">
        <Button onClick={onReset} className="rounded-full">
          {t.tryAgain ?? "Try again"}
        </Button>
        <Button
          variant="ghost"
          className="rounded-full"
          onClick={() => window.location.reload()}
        >
          {t.reload ?? "Reload the page"}
        </Button>
      </div>
    </div>
  )
}
