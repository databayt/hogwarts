import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { CourseCardSkeleton } from "./courses/course-card"

// =============================================================================
// STREAM ROOT — minimal centered loader for layout wrapper
// =============================================================================

export function StreamRootSkeleton() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="border-foreground/20 border-t-foreground size-8 animate-spin rounded-full border-2" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  )
}

// =============================================================================
// STREAM HOME — hero + 4 feature cards (above-the-fold)
// =============================================================================

export function StreamHomeSkeleton() {
  return (
    <div className="space-y-10 py-6">
      {/* Hero section */}
      <section className="py-8">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-center lg:gap-12">
          <Skeleton className="size-64 shrink-0 rounded-2xl" />
          <div className="max-w-lg space-y-4 text-center lg:text-start">
            <Skeleton className="mx-auto h-10 w-72 lg:mx-0" />
            <Skeleton className="mx-auto h-5 w-full lg:mx-0" />
            <Skeleton className="mx-auto h-5 w-3/4 lg:mx-0" />
            <Skeleton className="mx-auto h-10 w-36 rounded-md lg:mx-0" />
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="size-12 rounded-lg" />
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}

// =============================================================================
// STREAM COURSES — hero icon + search bar + 4-col card grid
// =============================================================================

export function StreamCoursesSkeleton() {
  return (
    <div className="space-y-10 py-6">
      {/* Hero section */}
      <section className="py-8">
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-6 md:flex-row">
          <Skeleton className="size-28 shrink-0 rounded-xl md:size-32" />
          <div className="space-y-2 text-center md:text-start">
            <Skeleton className="h-10 w-48 md:h-12" />
            <Skeleton className="h-10 w-36 md:h-12" />
          </div>
        </div>
      </section>

      {/* Search bar */}
      <section>
        <Skeleton className="mx-auto h-11 w-full max-w-2xl rounded-full" />
      </section>

      {/* Course cards grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="p-2">
            <CourseCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// STREAM COURSE DETAIL — 2-col hero + about + chapter listings
// =============================================================================

export function StreamCourseDetailSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left: content */}
          <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
            {/* Title */}
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-3/4" />
            </div>
            {/* Description */}
            <div className="space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-2/3" />
            </div>
            {/* CTA */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-40 rounded-md" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            {/* Share buttons */}
            <div className="flex items-center gap-4 pt-2">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="size-8 rounded-full" />
            </div>
          </div>

          {/* Right: image + stats */}
          <div className="space-y-0">
            <Skeleton className="aspect-video w-full rounded-t-lg" />
            <div className="mt-8 flex items-center justify-center gap-6 border-t px-1 pt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-1">
                  <Skeleton className="size-4" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About section */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="bg-muted/50 space-y-6 rounded-xl p-6 sm:p-8">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="h-6 w-40" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <Skeleton className="h-4 w-3/6" />
          </div>
        </div>
      </section>

      {/* Course sections */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <Skeleton className="h-8 w-44" />
        <div className="mt-6 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              {/* Chapter header */}
              <div className="flex items-center gap-4">
                <Skeleton className="size-10 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              {/* Horizontal lesson cards */}
              <div className="mt-3 flex gap-3 overflow-hidden px-1 pb-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="w-56 shrink-0 rounded-lg border">
                    <Skeleton className="h-28 w-full rounded-t-lg" />
                    <div className="space-y-2 p-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

// =============================================================================
// STREAM DASHBOARD — enrolled cards + available cards
// =============================================================================

export function StreamDashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Enrolled section */}
      <div>
        <div className="mb-6 flex flex-col gap-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <CardContent className="pt-4">
                <Skeleton className="mb-2 h-5 w-3/4" />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Skeleton className="h-10 w-full rounded-md" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Available section */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <CardContent className="pt-4">
                <Skeleton className="mb-2 h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-1 h-4 w-2/3" />
                <div className="mt-3 flex items-center gap-4">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between border-t pt-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-16 rounded-md" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// STREAM ADMIN DASHBOARD — stats + chart + recent courses
// =============================================================================

export function StreamAdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      {/* Stats */}
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

      {/* Chart placeholder */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </CardContent>
      </Card>

      {/* Recent courses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-9 w-32 rounded-md" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <Skeleton className="h-5 w-48" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-16 rounded-md" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// STREAM ADMIN COURSES — header + view toggle + card grid
// =============================================================================

export function StreamAdminCoursesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-36" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-[72px] rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="p-2">
            <CourseCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// STREAM COURSE EDIT — title + tabs + form
// =============================================================================

export function StreamCourseEditSkeleton() {
  return (
    <div>
      {/* Title */}
      <Skeleton className="mb-8 h-9 w-72" />

      {/* Tabs */}
      <div className="w-full">
        <div className="bg-muted grid w-full grid-cols-2 rounded-md p-1">
          <Skeleton className="h-8 rounded-sm" />
          <Skeleton className="h-8 rounded-sm" />
        </div>

        {/* Tab content */}
        <Card className="mt-4">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            <div className="flex justify-end">
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// =============================================================================
// STREAM LESSON EDIT — card with form fields
// =============================================================================

export function StreamLessonEditSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <div className="flex justify-end gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// STREAM LESSON PLAYER — breadcrumb + video + info + nav
// =============================================================================

export function StreamLessonPlayerSkeleton() {
  return (
    <div className="space-y-6 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Skeleton className="size-4" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-3" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-3" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Video player */}
      <Card>
        <CardContent className="p-0">
          <Skeleton className="aspect-video w-full rounded-t-lg" />
        </CardContent>
      </Card>

      {/* Lesson info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-9 w-36 shrink-0 rounded-md" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-24" />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-44 rounded-md" />
        <Skeleton className="h-10 w-44 rounded-md" />
      </div>
    </div>
  )
}

// =============================================================================
// STREAM COURSE SLUG — minimal centered (redirects to first lesson)
// =============================================================================

export function StreamCourseSlugSkeleton() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="border-foreground/20 border-t-foreground size-8 animate-spin rounded-full border-2" />
        <div className="space-y-2 text-center">
          <Skeleton className="mx-auto h-5 w-36" />
          <Skeleton className="mx-auto h-4 w-52" />
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// STREAM NOT ADMIN — centered access-denied card
// =============================================================================

export function StreamNotAdminSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Skeleton className="mx-auto size-24 rounded-full" />
          <Skeleton className="mx-auto mt-4 h-7 w-44" />
          <Skeleton className="mx-auto mt-2 h-4 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full rounded-md" />
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// STREAM PAYMENT — centered confirmation card (success & cancel)
// =============================================================================

export function StreamPaymentSkeleton() {
  return (
    <div className="flex min-h-screen w-full flex-1 items-center justify-center">
      <Card className="w-[400px]">
        <CardContent className="pt-6">
          <div className="flex w-full justify-center">
            <Skeleton className="size-12 rounded-full" />
          </div>
          <div className="mt-5 w-full text-center">
            <Skeleton className="mx-auto h-6 w-48" />
            <Skeleton className="mx-auto mt-2 h-4 w-64" />
            <div className="mt-5 space-y-2">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
