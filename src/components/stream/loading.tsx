// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

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
    <>
      {/* Hero — text left, animation right */}
      <section className="relative">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:gap-16">
          <div className="flex flex-1 flex-col items-start space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-12 w-48 sm:h-14 md:h-16 lg:h-[72px]" />
              <Skeleton className="h-7 w-72 sm:h-8 md:h-9 lg:h-10" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-11 w-36 rounded-md" />
              <Skeleton className="h-11 w-28 rounded-md" />
            </div>
          </div>
          <div className="flex flex-1 justify-center">
            <Skeleton className="h-58 w-full max-w-md rounded-lg md:h-70" />
          </div>
        </div>
      </section>

      {/* Feature cards — 4-col grid with mb-32 */}
      <section className="mb-32 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border shadow-none">
            <CardHeader>
              <Skeleton className="mb-4 size-12" />
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="mt-1 h-4 w-4/5" />
            </CardContent>
          </Card>
        ))}
      </section>

      {/* AI Fluency — full-width background with card overlay */}
      <div className="mb-16 h-[450px] w-full overflow-hidden rounded-xl">
        <Skeleton className="h-full w-full rounded-xl" />
      </div>

      {/* Skills — heading left (3 cols), carousel right (9 cols) */}
      <section className="py-16 sm:py-20 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-3">
            <Skeleton className="h-7 w-48 md:h-8" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-1 h-4 w-4/5" />
          </div>
          <div className="lg:col-span-9">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="relative h-[400px] overflow-hidden rounded-2xl"
                >
                  <Skeleton className="h-full w-full" />
                  <div className="bg-background absolute start-2 end-2 bottom-2 space-y-2 rounded-xl p-3">
                    <Skeleton className="h-4 w-16 rounded-full" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex items-center justify-center gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className={
                    i === 0 ? "h-2.5 w-6 rounded-full" : "size-2.5 rounded-full"
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Hot Releases — green bg, title + 4 cards */}
      <section className="mb-16 rounded-xl bg-[#BCD1CA] py-6">
        <div className="px-6">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="size-5" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-background overflow-hidden rounded-xl">
                <Skeleton className="aspect-video w-full" />
                <div className="space-y-2 p-4">
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="size-4 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-28" />
                  <div className="flex items-center gap-1">
                    <Skeleton className="size-3" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum — blue bg, title left + 2x2 grid right */}
      <section className="mb-16 rounded-xl bg-[#6A9BCC] py-16">
        <div className="px-6">
          <div className="flex flex-col items-start gap-12 md:flex-row">
            <div className="md:w-1/2">
              <Skeleton className="mb-4 h-10 w-64 bg-white/20" />
              <Skeleton className="h-5 w-full max-w-[70%] bg-white/20" />
              <Skeleton className="mt-1 h-5 w-3/5 max-w-[70%] bg-white/20" />
            </div>
            <div className="grid grid-cols-2 gap-10 md:w-1/2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="mb-4 h-14 w-14 bg-white/20" />
                  <Skeleton className="mb-3 h-5 w-36 bg-white/20" />
                  <Skeleton className="h-4 w-full bg-white/20" />
                  <Skeleton className="mt-1 h-4 w-4/5 bg-white/20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Teaching Hero — pink square + text + buttons */}
      <section className="mb-16 py-16 sm:py-20 md:py-24">
        <div className="flex flex-col items-start gap-8 md:flex-row">
          <Skeleton className="min-h-[140px] min-w-[140px] rounded-xl sm:min-h-[180px] sm:min-w-[180px] md:min-h-[200px] md:min-w-[200px]" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-64 sm:h-10 md:h-12" />
            <Skeleton className="h-5 w-full max-w-md" />
            <Skeleton className="h-5 w-3/4 max-w-md" />
            <div className="mt-3 flex gap-4">
              <Skeleton className="h-11 w-28 rounded-md" />
              <Skeleton className="h-11 w-28 rounded-md" />
            </div>
          </div>
        </div>
      </section>

      {/* Reasons — centered title + 3-col grid with images */}
      <section className="py-16 sm:py-20 md:py-24">
        <div className="mb-12 text-center md:mb-16">
          <Skeleton className="mx-auto h-8 w-72 md:h-9 lg:h-10" />
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 md:gap-12 lg:gap-16">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <Skeleton className="mb-6 size-[100px] rounded-lg" />
              <Skeleton className="mb-3 h-6 w-36" />
              <Skeleton className="h-4 w-full max-w-xs" />
              <Skeleton className="mt-1 h-4 w-4/5 max-w-xs" />
            </div>
          ))}
        </div>
      </section>

      {/* How to Begin — title + tabs + text/image split */}
      <section className="py-16 sm:py-20 md:py-24">
        <div className="mb-12 text-center">
          <Skeleton className="mx-auto h-9 w-52 md:h-10 lg:h-12" />
        </div>
        <div className="mb-16 flex justify-center">
          <div className="inline-flex gap-6 border-b md:gap-12">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-32 md:h-6" />
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-8 md:flex-row md:gap-16">
          <div className="space-y-4 md:w-[40%]">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="pt-6">
              <Skeleton className="mb-3 h-5 w-36" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="mt-1 h-4 w-5/6" />
            </div>
          </div>
          <div className="flex justify-center md:w-[60%]">
            <Skeleton className="h-64 w-full max-w-lg rounded-lg md:h-80" />
          </div>
        </div>
      </section>
    </>
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
