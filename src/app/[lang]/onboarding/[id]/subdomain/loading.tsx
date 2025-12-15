import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 p-8">
      <Skeleton className="h-2 w-full rounded-full" />
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-6 w-80" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-12 flex-1 rounded-md" />
        <Skeleton className="h-6 w-32" />
      </div>
      <Skeleton className="ml-auto h-10 w-24 rounded-md" />
    </div>
  )
}
