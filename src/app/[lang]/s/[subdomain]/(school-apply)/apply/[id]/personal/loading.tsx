import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <Skeleton className="mb-4 h-2 w-full rounded-full" />
      <Skeleton className="mb-8 h-10 w-64" />
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
      <div className="mt-8 flex justify-between">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
    </div>
  )
}
