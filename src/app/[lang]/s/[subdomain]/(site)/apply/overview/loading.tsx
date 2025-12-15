import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <Skeleton className="mb-8 h-12 w-48" />
      <Skeleton className="mb-8 h-6 w-96" />
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-lg border p-4"
          >
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="mt-8 h-12 w-full rounded-md" />
    </div>
  )
}
