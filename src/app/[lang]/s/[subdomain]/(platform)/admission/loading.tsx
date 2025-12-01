import { Skeleton } from "@/components/ui/skeleton"

export default function AdmissionLoading() {
  return (
    <div className="space-y-6">
      {/* Stats cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    </div>
  )
}
