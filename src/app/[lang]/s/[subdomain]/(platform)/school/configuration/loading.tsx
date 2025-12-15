import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Configuration sections skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
