import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 p-8">
      <Skeleton className="h-2 w-full rounded-full" />
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-6 w-80" />
      <Skeleton className="h-32 w-full rounded-md" />
      <Skeleton className="ms-auto h-10 w-24 rounded-md" />
    </div>
  )
}
