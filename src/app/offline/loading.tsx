import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-6 text-center">
        <Skeleton className="mx-auto h-24 w-24 rounded-full" />
        <Skeleton className="mx-auto h-10 w-48" />
        <Skeleton className="mx-auto h-6 w-64" />
      </div>
    </div>
  )
}
