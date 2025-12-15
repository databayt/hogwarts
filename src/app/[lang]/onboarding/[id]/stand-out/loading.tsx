import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 p-8">
      <Skeleton className="h-2 w-full rounded-full" />
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-6 w-96" />
      <div className="grid gap-4 sm:grid-cols-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="ml-auto h-10 w-24 rounded-md" />
    </div>
  )
}
