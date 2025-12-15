import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-2xl space-y-8 p-8">
        <Skeleton className="mx-auto h-12 w-48" />
        <Skeleton className="mx-auto h-6 w-80" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </div>
    </div>
  )
}
