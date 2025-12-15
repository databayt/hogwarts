import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <Skeleton className="mb-4 h-2 w-full rounded-full" />
      <Skeleton className="mb-8 h-10 w-64" />
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-3 rounded-lg border p-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
      <div className="mt-8 flex justify-between">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
    </div>
  )
}
