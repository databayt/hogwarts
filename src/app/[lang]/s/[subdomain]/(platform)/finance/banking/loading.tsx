import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonChart } from "@/components/ui/skeleton-chart"
import { SkeletonListCompact } from "@/components/ui/skeleton-list"
import { SkeletonStats } from "@/components/ui/skeleton-stats"

export default function BankingLoading() {
  return (
    <div className="layout-container">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>

        {/* Stats Cards */}
        <SkeletonStats count={4} />

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[350px] w-full" />
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <SkeletonListCompact items={5} showAvatar={true} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
