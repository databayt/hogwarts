"use client"

import React from "react"
import { AlertTriangle, RefreshCcw } from "lucide-react"

import { logger } from "@/lib/logger"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>
}

class OnboardingErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error using the logger service
    logger.error("Onboarding Error Boundary caught an error", error, {
      component: "OnboardingErrorBoundary",
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback

      return (
        <FallbackComponent
          error={this.state.error}
          reset={() => this.setState({ hasError: false })}
        />
      )
    }

    return this.props.children
  }
}

function DefaultErrorFallback({
  error,
  reset,
}: {
  error?: Error
  reset: () => void
}) {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-destructive/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <AlertTriangle className="text-destructive h-6 w-6" />
          </div>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            An error occurred while loading this step of the onboarding process.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {process.env.NODE_ENV === "development" && error && (
            <details className="text-start">
              <summary className="cursor-pointer text-sm font-medium">
                Error Details (Development Only)
              </summary>
              <pre className="bg-muted mt-2 overflow-auto rounded p-2 text-xs">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
          <div className="space-y-2">
            <Button onClick={reset} className="w-full">
              <RefreshCcw className="me-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Refresh Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Enhanced error boundary with more features
interface ErrorBoundaryOptions {
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  enableReporting?: boolean
  showErrorDetails?: boolean
}

export function createErrorBoundary(options: ErrorBoundaryOptions = {}) {
  return class extends OnboardingErrorBoundary {
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      super.componentDidCatch(error, errorInfo)

      if (options.onError) {
        options.onError(error, errorInfo)
      }

      if (options.enableReporting && process.env.NODE_ENV === "production") {
        // Send to error tracking service
        try {
          // Example implementation - replace with your error tracking service
          fetch("/api/error-report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              error: error.message,
              stack: error.stack,
              componentStack: errorInfo.componentStack,
              url: window.location.href,
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString(),
            }),
          }).catch((err) => logger.error("Failed to send error report", err))
        } catch (e) {
          logger.error("Failed to report error", e as Error)
        }
      }
    }
  }
}

export { OnboardingErrorBoundary }

// Re-export with alias for backward compatibility
export const ErrorBoundary = OnboardingErrorBoundary
