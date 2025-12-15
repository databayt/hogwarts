"use client"

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8">
      <div className="space-y-4 text-center">
        <h2 className="text-2xl font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground max-w-md">
          We encountered an issue loading this page. Please try again.
        </p>
        {error.digest && (
          <p className="text-muted-foreground text-xs">
            Error ID: {error.digest}
          </p>
        )}
      </div>
      <button
        onClick={reset}
        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-6 py-2 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
