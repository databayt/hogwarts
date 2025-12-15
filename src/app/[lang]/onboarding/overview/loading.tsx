import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-8">
      <Skeleton className="h-12 w-48" />
      <Skeleton className="h-6 w-80" />
      <div className="grid gap-6 sm:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-4 rounded-lg border p-6">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}
