import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-12">
      <Skeleton className="mb-8 h-12 w-48" />
      <Skeleton className="mb-4 h-6 w-full" />
      <Skeleton className="mb-4 h-6 w-full" />
      <Skeleton className="mb-12 h-6 w-3/4" />
      <Skeleton className="mb-12 h-80 w-full rounded-lg" />
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </div>
  )
}
