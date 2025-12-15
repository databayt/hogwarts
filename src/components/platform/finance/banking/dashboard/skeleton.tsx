export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header Skeleton */}
      <div>
        <div className="bg-muted mb-2 h-8 w-48 rounded-md" />
        <div className="bg-muted h-4 w-96 rounded-md" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-lg border p-6">
            <div className="bg-muted mb-2 h-4 w-24 rounded-md" />
            <div className="bg-muted h-8 w-32 rounded-md" />
          </div>
        ))}
      </div>

      {/* Transactions Table Skeleton */}
      <div className="bg-card rounded-lg border">
        <div className="border-b p-6">
          <div className="bg-muted h-6 w-40 rounded-md" />
        </div>
        <div className="space-y-4 p-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="bg-muted h-4 w-48 rounded-md" />
                <div className="bg-muted h-3 w-32 rounded-md" />
              </div>
              <div className="bg-muted h-5 w-20 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
