import { Skeleton } from "@/components/ui/skeleton"

export default function CardsLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* 3-column grid layout */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Stats */}
        <Skeleton className="h-48" />
        {/* Calendar */}
        <Skeleton className="h-72" />
        {/* Activity Goal */}
        <Skeleton className="h-64" />
        {/* Metric */}
        <Skeleton className="h-64" />
        {/* Exercise Minutes */}
        <Skeleton className="h-64" />
        {/* Forms */}
        <Skeleton className="h-80" />
        {/* Team Members */}
        <Skeleton className="h-72" />
        {/* Cookie Settings */}
        <Skeleton className="h-64" />
        {/* Create Account */}
        <Skeleton className="h-80" />
        {/* Chat */}
        <Skeleton className="h-96" />
        {/* Payment Method */}
        <Skeleton className="h-80" />
        {/* Report Issue */}
        <Skeleton className="h-72" />
        {/* Share */}
        <Skeleton className="h-64" />
        {/* Payments */}
        <Skeleton className="h-96" />
      </div>
    </div>
  )
}
