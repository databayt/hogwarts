import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col space-y-2">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <Skeleton className="h-4 w-24" />
            <div className="mt-3 flex items-center justify-between">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Skeleton className="col-span-4 h-80" />
        <Skeleton className="col-span-4 h-80 md:col-span-3" />
        <Skeleton className="col-span-4 h-80" />
        <Skeleton className="col-span-4 h-80 md:col-span-3" />
      </div>
    </div>
  )
}









