import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-6">
        <CardContent className="p-0">
          <div className="grid gap-4 md:grid-cols-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="p-6">
        <CardContent className="p-0">
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
