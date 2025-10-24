"use client";

import React from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

/**
 * Error boundary component for dashboard
 * Catches errors and displays user-friendly error messages
 */
export class DashboardErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
  },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service (e.g., Sentry)
    console.error("Dashboard error caught:", error, errorInfo);

    // In production, send to error tracking service
    if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
      // TODO: Send to Sentry or error tracking service
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} reset={this.handleReset} />;
      }

      return <DefaultErrorFallback error={this.state.error} reset={this.handleReset} />;
    }

    return this.props.children;
  }
}

/**
 * Default error fallback UI
 */
export function DefaultErrorFallback({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <div className="container mx-auto p-6">
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Dashboard Error</AlertTitle>
        <AlertDescription>
          We encountered an error while loading your dashboard. Please try refreshing the page.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred while loading your dashboard. Our team has been notified
            and is working to resolve the issue.
          </p>

          {isDevelopment && error && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="font-mono text-xs mb-2 font-semibold">Error Details:</p>
              <pre className="font-mono text-xs overflow-auto">
                {error.message}
                {error.stack && (
                  <>
                    {"\n\n"}Stack trace:{"\n"}
                    {error.stack}
                  </>
                )}
              </pre>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={reset} variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            <Button
              onClick={() => (window.location.href = "/")}
              variant="outline"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Error fallback for specific dashboard sections
 */
export function DashboardSectionError({
  title = "Section unavailable",
  message = "This section couldn't be loaded. Please try again.",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="border-destructive/50">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <AlertCircle className="h-8 w-8 text-destructive/70" />
          <div className="text-center space-y-2">
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
          </div>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-3 w-3" />
              Try Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Hook for error handling in dashboard components
 */
export function useDashboardError() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      // Log to monitoring service
      console.error("Dashboard component error:", error);
      // Could trigger toast notification here
    }
  }, [error]);

  const clearError = () => setError(null);

  return { error, setError, clearError };
}