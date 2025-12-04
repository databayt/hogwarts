import { Skeleton } from "@/components/ui/skeleton"

export default function CardsLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Main grid layout */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-10 xl:grid-cols-11">
        {/* Left column */}
        <div className="grid gap-4 lg:col-span-4 xl:col-span-6">
          {/* Stats row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-44" />
            <Skeleton className="h-44" />
          </div>

          {/* Forms column */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              <Skeleton className="h-[500px]" />
              <Skeleton className="h-48" />
              <Skeleton className="h-36" />
            </div>
            <div className="flex flex-col gap-4">
              <Skeleton className="h-80" />
              <Skeleton className="h-72" />
              <Skeleton className="h-64 hidden xl:block" />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4 lg:col-span-6 xl:col-span-5">
          {/* Calendar + Activity + Exercise */}
          <div className="hidden gap-4 md:grid sm:grid-cols-[auto_1fr]">
            <Skeleton className="h-72 w-[260px]" />
            <div className="flex flex-col gap-4">
              <Skeleton className="h-72" />
            </div>
          </div>
          <Skeleton className="h-52 sm:col-span-2" />

          {/* Payments table */}
          <Skeleton className="h-[400px] hidden md:block" />

          {/* Share card */}
          <Skeleton className="h-80" />

          {/* Report issue (mobile) */}
          <Skeleton className="h-64 xl:hidden" />
        </div>
      </div>
    </div>
  )
}
