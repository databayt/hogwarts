import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { SkeletonFormGrid } from "@/components/ui/skeleton-form"
import { SkeletonPageNav } from "@/components/ui/skeleton-page-nav"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <Skeleton className="h-8 w-64" />

      {/* Navigation tabs */}
      <SkeletonPageNav tabs={3} />

      {/* Generation options */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Settings form */}
        <Card>
          <CardContent className="pt-6">
            <SkeletonFormGrid fields={6} />
          </CardContent>
        </Card>

        {/* Preview/templates */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
