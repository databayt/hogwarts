import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ManualAttendanceLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-16 w-16 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Controls */}
      <Card className="p-4">
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-8 w-44" />
            <div className="ml-auto flex gap-2">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
          <Skeleton className="h-8 w-32" />
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="p-4">
        <CardContent className="p-0">
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
