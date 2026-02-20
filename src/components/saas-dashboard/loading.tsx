import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// =============================================================================
// SAAS DASHBOARD — PeriodSwitcher + 3 financial + metrics + charts
// =============================================================================

export function SaasDashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col space-y-6">
      {/* PeriodSwitcher toolbar */}
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-[200px] rounded-md" />
        </div>
      </div>

      {/* 3 financial metric cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="size-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-24" />
              <Skeleton className="mt-1 h-3 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MetricsCards (4 stat cards) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      {/* BarGraph */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </CardContent>
      </Card>

      {/* RecentSales */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* AreaGraph + PieGraph side by side */}
      <div className="flex w-full justify-between gap-6">
        <Card className="flex-1">
          <CardHeader>
            <Skeleton className="h-5 w-28" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full rounded-lg" />
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader>
            <Skeleton className="h-5 w-28" />
          </CardHeader>
          <CardContent>
            <Skeleton className="mx-auto h-[200px] w-[200px] rounded-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// =============================================================================
// SAAS ANALYTICS — heading + 4 stats + 2 charts + trends + projections
// =============================================================================

export function SaasAnalyticsSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Heading */}
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      {/* 4 stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      {/* 2 chart cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[250px] w-full rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Trends card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Projections card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-7 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// SAAS BILLING — heading + 4 stats + tabs + DataTable
// =============================================================================

export function SaasBillingSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Heading */}
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      {/* 4 stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      {/* Tabs */}
      <div className="space-y-4">
        <div className="bg-muted inline-flex rounded-md p-1">
          <Skeleton className="h-8 w-24 rounded-sm" />
          <Skeleton className="h-8 w-24 rounded-sm" />
        </div>

        {/* Table */}
        <div className="flex justify-end">
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
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
    </div>
  )
}

// =============================================================================
// SAAS BILLING RECEIPTS — header + button + 4 stats + DataTable
// =============================================================================

export function SaasBillingReceiptsSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header with button */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-36" />
          <Skeleton className="mt-2 h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>

      {/* 4 stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
// SAAS DOMAINS — heading + 5 stats + section header + DataTable
// =============================================================================

export function SaasDomainsSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Heading */}
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      {/* 5 stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-16" />
              <Skeleton className="mt-1 h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>

        {/* DataTable */}
        <div className="rounded-md border">
          <div className="bg-muted/50 flex h-12 items-center border-b px-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="mx-2 h-4 w-24 flex-1" />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
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
    </div>
  )
}

// =============================================================================
// SAAS KANBAN — header + button + 4-column board
// =============================================================================

export function SaasKanbanSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="h-8 w-28" />
          <Skeleton className="mt-2 h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      {/* Kanban board columns */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {["Backlog", "Todo", "In Progress", "Done"].map((_, i) => (
          <div key={i} className="space-y-3">
            {/* Column header */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Skeleton className="size-3 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-5 w-6 rounded-full" />
            </div>
            {/* Cards */}
            {Array.from({ length: 3 - Math.floor(i / 2) }).map((_, j) => (
              <Card key={j}>
                <CardContent className="space-y-2 p-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <div className="flex items-center justify-between pt-1">
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="size-6 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// SAAS OBSERVABILITY — heading + audit log table
// =============================================================================

export function SaasObservabilitySkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Heading */}
      <div>
        <Skeleton className="h-8 w-36" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-9 w-[250px]" />
        <Skeleton className="h-9 w-[100px]" />
      </div>

      {/* DataTable */}
      <div className="rounded-md border">
        <div className="bg-muted/50 flex h-12 items-center border-b px-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="mx-2 h-4 w-24 flex-1" />
          ))}
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex h-14 items-center border-b px-4 last:border-b-0"
          >
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton
                key={j}
                className="mx-2 h-4 w-full max-w-[200px] flex-1"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// SAAS PRODUCT — header + button + separator + placeholder
// =============================================================================

export function SaasProductSkeleton() {
  return (
    <div className="flex flex-1 flex-col space-y-4">
      {/* Header with button */}
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="h-6 w-28" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>

      <Skeleton className="h-px w-full" />

      {/* Placeholder / future table */}
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <div className="space-y-2 text-center">
            <Skeleton className="mx-auto size-12 rounded-lg" />
            <Skeleton className="mx-auto h-5 w-36" />
            <Skeleton className="mx-auto h-4 w-56" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// SAAS PRODUCT DETAIL — heading + card
// =============================================================================

export function SaasProductDetailSkeleton() {
  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div>
        <Skeleton className="h-6 w-28" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <div className="space-y-2 text-center">
            <Skeleton className="mx-auto size-12 rounded-lg" />
            <Skeleton className="mx-auto h-5 w-36" />
            <Skeleton className="mx-auto h-4 w-56" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// SAAS PROFILE — heading + placeholder card
// =============================================================================

export function SaasProfileSkeleton() {
  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <div className="space-y-2 text-center">
            <Skeleton className="mx-auto size-16 rounded-full" />
            <Skeleton className="mx-auto h-5 w-36" />
            <Skeleton className="mx-auto h-4 w-56" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// SAAS SALES — DataTable (the content is just OperatorSalesTable)
// =============================================================================

export function SaasSalesSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-1 items-center gap-2">
          <Skeleton className="h-9 w-[250px]" />
          <Skeleton className="h-9 w-[100px]" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      {/* DataTable */}
      <div className="rounded-md border">
        <div className="bg-muted/50 flex h-12 items-center border-b px-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="mx-2 h-4 w-20 flex-1" />
          ))}
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex h-14 items-center border-b px-4 last:border-b-0"
          >
            {Array.from({ length: 7 }).map((_, j) => (
              <Skeleton
                key={j}
                className="mx-2 h-4 w-full max-w-[150px] flex-1"
              />
            ))}
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <Skeleton className="h-4 w-[140px]" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-[100px]" />
          <div className="flex items-center gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="size-8" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// SAAS SALES ANALYTICS — simple placeholder (page is bare)
// =============================================================================

export function SaasSalesAnalyticsSkeleton() {
  return (
    <div className="flex flex-1 items-center justify-center py-20">
      <div className="space-y-2 text-center">
        <Skeleton className="mx-auto size-12 rounded-lg" />
        <Skeleton className="mx-auto h-6 w-40" />
        <Skeleton className="mx-auto h-4 w-56" />
      </div>
    </div>
  )
}

// =============================================================================
// SAAS SALES IMPORT — simple placeholder (page is bare)
// =============================================================================

export function SaasSalesImportSkeleton() {
  return (
    <div className="flex flex-1 items-center justify-center py-20">
      <div className="space-y-2 text-center">
        <Skeleton className="mx-auto size-12 rounded-lg" />
        <Skeleton className="mx-auto h-6 w-32" />
        <Skeleton className="mx-auto h-4 w-56" />
      </div>
    </div>
  )
}

// =============================================================================
// SAAS TENANTS — heading + 5 stats + 4 plans + section + DataTable
// =============================================================================

export function SaasTenantsSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Heading */}
      <div>
        <Skeleton className="h-8 w-28" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      {/* 5 stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-16" />
              <Skeleton className="mt-1 h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 4 plan distribution cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-12" />
              <Skeleton className="mt-1 h-3 w-20" />
            </CardContent>
            <CardFooter className="pt-0">
              <Skeleton className="h-2 w-full rounded-full" />
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Section header + DataTable */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>

        <div className="rounded-md border">
          <div className="bg-muted/50 flex h-12 items-center border-b px-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="mx-2 h-4 w-20 flex-1" />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex h-14 items-center border-b px-4 last:border-b-0"
            >
              <Skeleton className="mx-2 size-8 rounded-full" />
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton
                  key={j}
                  className="mx-2 h-4 w-full max-w-[160px] flex-1"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
