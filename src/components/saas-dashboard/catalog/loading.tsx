import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// =============================================================================
// CATALOG — 3 stats + DataTable
// =============================================================================

export function CatalogSkeleton() {
  return (
    <div className="space-y-6">
      {/* 3 stat cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-20" />
              <Skeleton className="mt-1 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* DataTable */}
      <div className="rounded-md border">
        <div className="bg-muted/50 flex h-12 items-center border-b px-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="mx-2 h-4 w-24 flex-1" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex h-14 items-center border-b px-4 last:border-b-0"
          >
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton
                key={j}
                className="mx-2 h-4 w-full max-w-[180px] flex-1"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// CATALOG DETAIL — breadcrumb + hero + 3 stats + thumbnail + curriculum tree
// =============================================================================

export function CatalogDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Skeleton className="h-4 w-48" />

      {/* Hero banner */}
      <div className="rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 p-6 dark:from-blue-950/20 dark:to-purple-950/20">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-96" />
        <div className="mt-3 flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>

      {/* 3 stat cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-20" />
              <Skeleton className="mt-1 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Thumbnail card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full rounded-lg" />
        </CardContent>
      </Card>

      {/* Curriculum tree card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-1 h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-28 rounded-md" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4" />
                <Skeleton className="h-4 w-48" />
              </div>
              {i < 2 && (
                <div className="mt-2 space-y-2 ps-6">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-4 w-40" />
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// CATALOG ANALYTICS — 6 stats + 2 table cards side by side
// =============================================================================

export function CatalogAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* 6 stat cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="size-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-16" />
              <Skeleton className="mt-1 h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 2 table cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="bg-muted/50 flex h-10 items-center border-b px-3">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <Skeleton key={j} className="mx-1 h-3 w-16 flex-1" />
                  ))}
                </div>
                {Array.from({ length: 5 }).map((_, j) => (
                  <div
                    key={j}
                    className="flex h-12 items-center border-b px-3 last:border-b-0"
                  >
                    {Array.from({ length: 6 }).map((_, k) => (
                      <Skeleton
                        key={k}
                        className="mx-1 h-3 w-full max-w-[100px] flex-1"
                      />
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// CATALOG STATS + TABLE — 4 stats + DataTable (shared by approvals, assignments, materials, questions)
// =============================================================================

export function CatalogStatsTableSkeleton() {
  return (
    <div className="space-y-6">
      {/* 4 stat cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-20" />
              <Skeleton className="mt-1 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* DataTable */}
      <div className="rounded-md border">
        <div className="bg-muted/50 flex h-12 items-center border-b px-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="mx-2 h-4 w-24 flex-1" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex h-14 items-center border-b px-4 last:border-b-0"
          >
            {Array.from({ length: 6 }).map((_, j) => (
              <Skeleton
                key={j}
                className="mx-2 h-4 w-full max-w-[160px] flex-1"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
