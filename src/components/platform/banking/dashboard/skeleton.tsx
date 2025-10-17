export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div>
        <div className="h-8 w-48 bg-muted rounded-md mb-2" />
        <div className="h-4 w-96 bg-muted rounded-md" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <div className="h-4 w-24 bg-muted rounded-md mb-2" />
            <div className="h-8 w-32 bg-muted rounded-md" />
          </div>
        ))}
      </div>

      {/* Transactions Table Skeleton */}
      <div className="rounded-lg border bg-card">
        <div className="border-b p-6">
          <div className="h-6 w-40 bg-muted rounded-md" />
        </div>
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-48 bg-muted rounded-md" />
                <div className="h-3 w-32 bg-muted rounded-md" />
              </div>
              <div className="h-5 w-20 bg-muted rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}