import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section Skeleton */}
      <div className="grid min-h-[calc(100vh-3.5rem)] grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-6 py-12 lg:py-0">
          <Skeleton className="h-16 w-3/4 md:h-24" />
          <Skeleton className="h-12 w-1/2 md:h-16" />
          <Skeleton className="h-6 w-full max-w-md" />
          <Skeleton className="h-6 w-4/5 max-w-md" />
          <div className="flex gap-3">
            <Skeleton className="h-12 w-40 rounded-md" />
            <Skeleton className="h-12 w-40 rounded-md" />
          </div>
        </div>
        <div className="hidden lg:flex lg:justify-end">
          <Skeleton className="h-[450px] w-[450px] rounded-full" />
        </div>
      </div>

      {/* Programs Section Skeleton */}
      <div className="py-16 md:py-24">
        <Skeleton className="mb-8 h-10 w-64" />
        <Skeleton className="mb-16 h-6 w-full max-w-3xl" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-muted space-y-4 rounded-2xl p-6">
              <Skeleton className="h-12 w-16" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section Skeleton */}
      <div className="py-16 md:py-24">
        <div className="mb-16 text-center">
          <Skeleton className="mx-auto mb-4 h-10 w-48" />
          <Skeleton className="mx-auto h-6 w-96" />
        </div>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center">
              <Skeleton className="mx-auto mb-4 h-12 w-12 rounded-full" />
              <Skeleton className="mx-auto mb-2 h-10 w-20" />
              <Skeleton className="mx-auto h-4 w-32" />
            </div>
          ))}
        </div>
      </div>

      {/* Curriculum Section Skeleton */}
      <div className="py-16 md:py-24">
        <Skeleton className="mb-4 h-10 w-64" />
        <Skeleton className="mb-16 h-6 w-full max-w-3xl" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-4 rounded-lg border p-6">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <div className="space-y-2">
                {[...Array(5)].map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section Skeleton */}
      <div className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Skeleton className="mx-auto mb-6 h-10 w-64" />
          <Skeleton className="mx-auto mb-8 h-6 w-full max-w-xl" />
          <div className="flex justify-center gap-4">
            <Skeleton className="h-12 w-40 rounded-md" />
            <Skeleton className="h-12 w-40 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}
