"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ApplyErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Apply Error Boundary caught an error:", error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <div className="bg-destructive/10 mb-6 flex h-16 w-16 items-center justify-center rounded-full">
            <AlertCircle className="text-destructive h-8 w-8" />
          </div>
          <h2 className="mb-2 text-xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            An error occurred while processing your application. Please try
            again or contact support if the problem persists.
          </p>
          <div className="flex gap-4">
            <Button onClick={this.handleReset} variant="outline">
              <RefreshCw className="me-2 h-4 w-4" />
              Try Again
            </Button>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre className="bg-muted mt-8 max-w-full overflow-auto rounded-lg p-4 text-left text-xs">
              {this.state.error.message}
              {"\n"}
              {this.state.error.stack}
            </pre>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export default ApplyErrorBoundary
