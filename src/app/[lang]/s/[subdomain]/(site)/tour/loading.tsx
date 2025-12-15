import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-12">
      <Skeleton className="mb-8 h-12 w-48" />
      <Skeleton className="mb-8 h-6 w-80" />
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="h-80 w-full rounded-lg" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="space-y-6 rounded-lg border p-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </div>
    </div>
  )
}
