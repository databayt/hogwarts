import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <Skeleton className="mb-8 h-12 w-64" />
      <Skeleton className="mb-8 h-6 w-80" />
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
    </div>
  )
}
