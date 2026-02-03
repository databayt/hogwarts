import { Skeleton } from "@/components/ui/skeleton"

export function OperatorLoadingSkeleton() {
  return (
    <div className="flex min-h-svh w-full">
      {/* Sidebar skeleton */}
      <div className="border-border w-64 border-r p-4">
        <Skeleton className="mb-6 h-8 w-32" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="mb-2 h-10 w-full" />
        ))}
      </div>
      {/* Main content skeleton */}
      <div className="flex-1 p-6">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}
