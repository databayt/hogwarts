import React from "react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// =============================================================================
// LOADING SPINNER
// =============================================================================

interface LoadingProps {
  onComplete?: () => void
}

const Loading: React.FC<LoadingProps> = ({ onComplete }) => {
  React.useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(() => {
        onComplete()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [onComplete])

  return (
    <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <div className="border-foreground/20 border-t-foreground h-9 w-9 animate-spin rounded-full border-2"></div>
      </div>
    </div>
  )
}

export default Loading

// =============================================================================
// DATA TABLE SKELETONS
// =============================================================================

interface SkeletonDataTableProps {
  columns?: number
  rows?: number
  showToolbar?: boolean
  showPagination?: boolean
  className?: string
}

export function SkeletonDataTable({
  columns = 5,
  rows = 10,
  showToolbar = true,
  showPagination = true,
  className,
}: SkeletonDataTableProps) {
  return (
    <div className={cn("flex w-full flex-col gap-2.5", className)}>
      {showToolbar && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-1 items-center gap-2">
            <Skeleton className="h-8 w-[250px]" />
            <Skeleton className="h-8 w-[100px]" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-md border">
        <div className="w-full">
          <div className="bg-muted/50 border-b">
            <div className="flex h-12 items-center px-2">
              {Array.from({ length: columns }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center px-2",
                    i === 0 ? "w-[50px]" : "flex-1"
                  )}
                >
                  {i === 0 ? (
                    <Skeleton className="h-4 w-4 rounded" />
                  ) : (
                    <Skeleton className="h-4 w-24" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="flex h-[57px] items-center border-b px-2 last:border-b-0"
              >
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <div
                    key={colIndex}
                    className={cn(
                      "flex items-center px-2",
                      colIndex === 0 ? "w-[50px]" : "flex-1"
                    )}
                  >
                    {colIndex === 0 ? (
                      <Skeleton className="h-4 w-4 rounded" />
                    ) : (
                      <Skeleton className="h-4 w-full max-w-[200px]" />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showPagination && (
        <div className="flex items-center justify-between px-2">
          <Skeleton className="h-4 w-[140px]" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-[100px]" />
            <div className="flex items-center gap-1">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function SkeletonDataTableCompact({
  columns = 4,
  rows = 5,
  className,
}: Omit<SkeletonDataTableProps, "showToolbar" | "showPagination">) {
  return (
    <SkeletonDataTable
      columns={columns}
      rows={rows}
      showToolbar={false}
      showPagination={false}
      className={className}
    />
  )
}

// =============================================================================
// STATS SKELETONS
// =============================================================================

interface SkeletonStatsProps {
  count?: number
  columns?: string
  className?: string
}

export function SkeletonStats({
  count = 4,
  columns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  className,
}: SkeletonStatsProps) {
  return (
    <div className={cn("grid gap-4", columns, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="mb-1 h-7 w-32" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function SkeletonStatsLarge({
  count = 3,
  className,
}: Omit<SkeletonStatsProps, "columns">) {
  return (
    <div className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-40" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function SkeletonStatsRow({
  count = 5,
  className,
}: Omit<SkeletonStatsProps, "columns">) {
  return (
    <div className={cn("flex items-center gap-8 border-y py-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// CHART SKELETONS
// =============================================================================

interface SkeletonChartProps {
  variant?: "bar" | "line" | "pie" | "area"
  showCard?: boolean
  height?: string
  className?: string
}

function BarChartSkeleton() {
  return (
    <div className="flex h-full items-end justify-around gap-2 pb-8">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-2">
          <Skeleton
            className="w-full"
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
          <Skeleton className="h-3 w-8" />
        </div>
      ))}
    </div>
  )
}

function LineChartSkeleton() {
  return (
    <div className="relative h-full">
      <div className="absolute top-0 bottom-8 left-0 flex flex-col justify-between">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-8" />
        ))}
      </div>
      <div className="ml-12 flex h-full flex-col">
        <div className="relative flex-1">
          <div className="absolute inset-0 flex items-center">
            <Skeleton className="h-1 w-full" />
          </div>
        </div>
        <div className="flex justify-around pt-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-8" />
          ))}
        </div>
      </div>
    </div>
  )
}

function PieChartSkeleton() {
  return (
    <div className="flex h-full items-center justify-center">
      <Skeleton className="h-48 w-48 rounded-full" />
    </div>
  )
}

function AreaChartSkeleton() {
  return (
    <div className="relative h-full">
      <div className="absolute inset-0 flex items-end justify-around gap-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1"
            style={{ height: `${Math.random() * 70 + 30}%` }}
          />
        ))}
      </div>
      <div className="absolute right-0 bottom-0 left-0 flex justify-around pt-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-8" />
        ))}
      </div>
    </div>
  )
}

export function SkeletonChart({
  variant = "bar",
  showCard = true,
  height = "h-[300px]",
  className,
}: SkeletonChartProps) {
  const ChartContent = (
    <>
      {showCard && (
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </CardHeader>
      )}

      <CardContent className={cn(showCard && "pt-0")}>
        <div className={cn(height, "relative w-full")}>
          {variant === "bar" && <BarChartSkeleton />}
          {variant === "line" && <LineChartSkeleton />}
          {variant === "pie" && <PieChartSkeleton />}
          {variant === "area" && <AreaChartSkeleton />}
        </div>

        <div className="mt-4 flex items-center justify-center gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </>
  )

  if (showCard) {
    return <Card className={className}>{ChartContent}</Card>
  }

  return <div className={className}>{ChartContent}</div>
}

export function SkeletonChartGrid({
  count = 2,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={cn("grid gap-6 md:grid-cols-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonChart key={i} variant={i % 2 === 0 ? "bar" : "line"} />
      ))}
    </div>
  )
}

// =============================================================================
// LIST SKELETONS
// =============================================================================

interface SkeletonListProps {
  items?: number
  showAvatar?: boolean
  showCards?: boolean
  className?: string
}

export function SkeletonList({
  items = 8,
  showAvatar = true,
  showCards = false,
  className,
}: SkeletonListProps) {
  const ListItem = () => (
    <div
      className={cn(
        "flex items-start gap-4 p-4",
        !showCards && "border-b last:border-b-0"
      )}
    >
      {showAvatar && (
        <Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />
      )}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-3 w-16 flex-shrink-0" />
    </div>
  )

  if (showCards) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: items }).map((_, i) => (
          <Card key={i}>
            <ListItem />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("divide-y rounded-lg border", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <ListItem key={i} />
      ))}
    </div>
  )
}

export function SkeletonListCompact({
  items = 10,
  showAvatar = true,
  className,
}: Omit<SkeletonListProps, "showCards">) {
  return (
    <div className={cn("divide-y rounded-lg border", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          {showAvatar && <Skeleton className="h-8 w-8 rounded-full" />}
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonActivityFeed({
  items = 6,
  className,
}: Omit<SkeletonListProps, "showAvatar" | "showCards">) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <Skeleton className="h-8 w-8 rounded-full" />
            {i < items - 1 && <div className="bg-border mt-2 w-0.5 flex-1" />}
          </div>
          <div className="flex-1 space-y-2 pb-6">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// FORM SKELETONS
// =============================================================================

interface SkeletonFormProps {
  fields?: number
  showCard?: boolean
  className?: string
}

export function SkeletonForm({
  fields = 6,
  showCard = false,
  className,
}: SkeletonFormProps) {
  const FormContent = (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )

  if (showCard) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent>{FormContent}</CardContent>
      </Card>
    )
  }

  return FormContent
}

export function SkeletonFormGrid({
  fields = 8,
  className,
}: Omit<SkeletonFormProps, "showCard">) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid gap-6 sm:grid-cols-2">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}

export function SkeletonFormSection({
  fields = 4,
  className,
}: Omit<SkeletonFormProps, "showCard">) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// CARD SKELETONS
// =============================================================================

export function SkeletonCard() {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-9 w-24" />
      </CardContent>
    </Card>
  )
}

export function SkeletonCardCompact() {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-5 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20" />
      </CardContent>
    </Card>
  )
}

export function SkeletonStatCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-32" />
        <Skeleton className="mt-1 h-3 w-24" />
      </CardContent>
    </Card>
  )
}

// =============================================================================
// CALENDAR SKELETONS
// =============================================================================

interface SkeletonCalendarProps {
  days?: number
  periods?: number
  showTime?: boolean
  className?: string
}

export function SkeletonCalendar({
  days = 7,
  periods = 8,
  showTime = true,
  className,
}: SkeletonCalendarProps) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border", className)}>
      <div className="min-w-full">
        <div className="bg-muted/50 flex border-b">
          {showTime && (
            <div className="flex w-[100px] items-center justify-center border-r p-4">
              <Skeleton className="h-4 w-16" />
            </div>
          )}
          {Array.from({ length: days }).map((_, i) => (
            <div
              key={i}
              className="min-w-[120px] flex-1 border-r p-4 last:border-r-0"
            >
              <Skeleton className="mx-auto h-4 w-16" />
            </div>
          ))}
        </div>

        {Array.from({ length: periods }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex border-b last:border-b-0">
            {showTime && (
              <div className="flex w-[100px] flex-col items-center justify-center border-r p-4">
                <Skeleton className="mb-1 h-4 w-12" />
                <Skeleton className="h-3 w-20" />
              </div>
            )}
            {Array.from({ length: days }).map((_, colIndex) => (
              <div
                key={colIndex}
                className="min-h-[80px] min-w-[120px] flex-1 border-r p-4 last:border-r-0"
              >
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonCalendarCompact({
  periods = 8,
  className,
}: Omit<SkeletonCalendarProps, "days" | "showTime">) {
  return (
    <SkeletonCalendar
      days={5}
      periods={periods}
      showTime={true}
      className={className}
    />
  )
}

export function SkeletonMonthCalendar({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border", className)}>
      <div className="flex items-center justify-between border-b p-4">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>

      <div className="grid grid-cols-7 border-b">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="border-r p-2 last:border-r-0">
            <Skeleton className="mx-auto h-4 w-8" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="h-20 border-r border-b p-2 last:border-r-0">
            <Skeleton className="h-4 w-6" />
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// PAGE NAV SKELETONS
// =============================================================================

interface SkeletonPageNavProps {
  tabs?: number
  className?: string
}

export function SkeletonPageNav({ tabs = 4, className }: SkeletonPageNavProps) {
  return (
    <div className={cn("border-b", className)}>
      <nav className="flex items-center gap-6">
        {Array.from({ length: tabs }).map((_, i) => (
          <div key={i} className="relative pb-3">
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </nav>
    </div>
  )
}

export function SkeletonPageNavWide({
  tabs = 7,
  className,
}: SkeletonPageNavProps) {
  return (
    <div className={cn("border-b", className)}>
      <div className="max-w-[600px] overflow-x-auto lg:max-w-none">
        <nav className="flex items-center gap-6">
          {Array.from({ length: tabs }).map((_, i) => (
            <div key={i} className="relative pb-3 whitespace-nowrap">
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}
