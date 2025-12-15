import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-12">
      <Skeleton className="mx-auto mb-4 h-12 w-48" />
      <Skeleton className="mx-auto mb-12 h-6 w-80" />
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-6 rounded-lg border p-6">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-4 w-full" />
            <div className="space-y-3">
              {[...Array(5)].map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
