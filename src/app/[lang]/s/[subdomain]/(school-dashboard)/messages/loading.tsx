import { Skeleton } from "@/components/ui/skeleton"

export default function MessagesLoading() {
  return (
    <div className="bg-background flex h-full">
      {/* Sidebar skeleton - conversation list */}
      <div className="border-border w-full flex-shrink-0 space-y-4 border-r p-4 sm:w-96 md:w-[430px]">
        {/* Search bar skeleton */}
        <Skeleton className="h-10 w-full rounded-md" />

        {/* New conversation button skeleton */}
        <Skeleton className="h-10 w-full rounded-md" />

        {/* Conversation list skeletons */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-3 p-2">
            <Skeleton className="h-12 w-12 flex-shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>

      {/* Chat area skeleton - hidden on mobile, visible on desktop */}
      <div className="bg-muted/20 hidden flex-1 flex-col md:flex">
        {/* Chat header skeleton */}
        <div className="border-border flex items-center gap-3 border-b p-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>

        {/* Messages area skeleton */}
        <div className="flex-1 space-y-4 p-4">
          {/* Centered message */}
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Skeleton className="mx-auto mb-4 h-16 w-16 rounded-full" />
              <Skeleton className="mx-auto h-4 w-48" />
            </div>
          </div>
        </div>

        {/* Input area skeleton */}
        <div className="border-border border-t p-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 flex-1 rounded-md" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
