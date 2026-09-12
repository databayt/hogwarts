// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TimetableGridSkeleton } from "@/components/school-dashboard/timetable/views/grid-skeleton"

// =============================================================================
// TIMETABLE BY-CLASS — Card with filters + timetable grid
// =============================================================================

export function TimetableByClassSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter selects + button */}
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-10 w-[180px] rounded-md" />
            <Skeleton className="h-10 w-[180px] rounded-md" />
            <Skeleton className="h-10 w-10 rounded-md" />
          </div>

          {/* Info banner */}
          <Skeleton className="h-16 w-full rounded-lg" />

          {/* Timetable grid placeholder */}
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// TIMETABLE BY-TEACHER — Card with filters + 2-col info + timetable grid
// =============================================================================

export function TimetableByTeacherSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter selects + button */}
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-10 w-[180px] rounded-md" />
            <Skeleton className="h-10 w-[180px] rounded-md" />
            <Skeleton className="h-10 w-10 rounded-md" />
          </div>

          {/* Teacher info + workload: 2-col grid */}
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>

          {/* Timetable grid placeholder */}
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// TIMETABLE BY-ROOM — Card with filters + 2-col info/utilization + timetable grid
// =============================================================================

export function TimetableByRoomSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter selects + button */}
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-10 w-[180px] rounded-md" />
            <Skeleton className="h-10 w-[180px] rounded-md" />
            <Skeleton className="h-10 w-10 rounded-md" />
          </div>

          {/* Room info + utilization: 2-col grid */}
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-20 w-full rounded-lg" />
            <div className="space-y-2 rounded-lg border p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>

          {/* Timetable grid placeholder */}
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// LIBRARY — Hero + BookList rows (Netflix-style, space-y-12)
// =============================================================================

/**
 * Shimmer stops for the two library surfaces that are NOT the page ground.
 *
 * `Skeleton` paints a gradient, so a `bg-*` utility on it is covered rather
 * than applied — the tint has to replace the STOPS. And it has to be a tint:
 * the default `accent` is a near-white grey that vanishes on the featured
 * card's cream and reads as a pale smear on the banner's green.
 */
const ON_GREEN = "from-[#050505]/10 via-[#050505]/5 to-[#050505]/10"
const ON_CREAM = cn(
  "from-black/[0.07] via-black/[0.03] to-black/[0.07]",
  // The featured card is cream in light and `muted/50` in dark, so this one
  // needs both. `ON_GREEN` does not: the banner's ground is a pinned brand
  // colour and never inverts, exactly as the real hero never does.
  "dark:from-white/[0.07] dark:via-white/[0.03] dark:to-white/[0.07]"
)

export function LibrarySkeleton() {
  return (
    <div className="w-full min-w-0 space-y-12 overflow-hidden">
      {/* Hero — the green banner in `library/hero.tsx`.

          Drawn as the real card rather than as a grey block: the banner's
          ground is a brand colour that does not fade in, so a placeholder
          rectangle where it will be reads as a different page, and the swap
          on load is a flash. The shell is the banner's own geometry —
          `rounded-[36px]`, the same padding, the same 259px floor — and only
          the ink inside it is a Skeleton.

          This block was stale for as long as the banner has shipped: it still
          drew the hero this page had BEFORE it, a 7xl wordmark beside a Lottie
          in a two-column row, so the skeleton and the page disagreed on both
          the shape and the column count. If the banner changes again, this
          changes with it — and so does /live's, which is the same object. */}
      <section>
        <div className="relative flex flex-col justify-between gap-8 overflow-hidden rounded-[36px] bg-[#00bc6d] px-8 py-10 sm:px-12 lg:min-h-[259px] lg:flex-row lg:items-center lg:py-12">
          <div className="min-w-0">
            {/* Two headline lines inside the banner's own ~420px measure */}
            <div className="space-y-3">
              <Skeleton
                className={cn(ON_GREEN, "h-8 w-64 lg:h-10 lg:w-[420px]")}
              />
              <Skeleton
                className={cn(ON_GREEN, "h-8 w-52 lg:h-10 lg:w-[380px]")}
              />
            </div>
            {/* The two pills — h-10, fully rounded, as in `pill()` */}
            <div className="mt-7 flex flex-wrap items-center gap-2">
              <Skeleton className={cn(ON_GREEN, "h-10 w-32 rounded-full")} />
              <Skeleton className={cn(ON_GREEN, "h-10 w-28 rounded-full")} />
            </div>
          </div>
          {/* The marginalia mark, hidden below md exactly as the banner hides it */}
          <Skeleton
            className={cn(
              ON_GREEN,
              "hidden size-[150px] shrink-0 rounded-2xl md:block lg:size-[168px]"
            )}
          />
        </div>
      </section>

      {/* The one featured book — matches `library/collaborate-section.tsx`.
          The text column is taller than it was: the blurb is the book's
          opening paragraph now and is no longer clamped to four lines. */}
      <section className="dark:bg-muted/50 w-full max-w-full overflow-hidden rounded-2xl bg-[#F5F5F0]">
        <div className="flex flex-col lg:flex-row">
          {/* Cover photograph, left */}
          <Skeleton
            className={cn(
              ON_CREAM,
              "aspect-[4/3] w-full rounded-none lg:aspect-auto lg:w-1/2"
            )}
          />
          {/* Title, byline, blurb, CTA — right */}
          <div className="flex flex-col justify-center gap-4 p-8 lg:w-1/2 lg:p-12">
            <Skeleton className={cn(ON_CREAM, "h-9 w-3/4 lg:h-10")} />
            <Skeleton className={cn(ON_CREAM, "h-5 w-40")} />
            <div className="space-y-2">
              <Skeleton className={cn(ON_CREAM, "h-4 w-full")} />
              <Skeleton className={cn(ON_CREAM, "h-4 w-full")} />
              <Skeleton className={cn(ON_CREAM, "h-4 w-11/12")} />
              <Skeleton className={cn(ON_CREAM, "h-4 w-4/5")} />
            </div>
            <Skeleton className={cn(ON_CREAM, "mt-2 h-11 w-28 rounded-md")} />
          </div>
        </div>
      </section>

      {/* 4 BookList rows — matches book-list/content.tsx */}
      {Array.from({ length: 4 }).map((_, i) => (
        <section key={i}>
          <div className="mb-6 flex items-center justify-between">
            <Skeleton className="h-8 w-36" />
          </div>
          <div className="flex gap-4 overflow-hidden pb-4">
            {Array.from({ length: 8 }).map((_, j) => (
              <Skeleton
                key={j}
                className="aspect-[2/3] w-32 flex-shrink-0 rounded-md sm:w-36 md:w-40"
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

// =============================================================================
// SCHOOL ACADEMIC — Card with 5-tab Tabs + DataTable per tab
// =============================================================================

export function SchoolAcademicSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent>
        {/* 5-column TabsList */}
        <div className="bg-muted grid w-full grid-cols-5 rounded-md p-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 rounded-sm" />
          ))}
        </div>

        {/* Tab content: sub-heading + DataTable */}
        <div className="mt-6 space-y-4">
          <div>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-1 h-4 w-56" />
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <div className="bg-muted/50 flex h-12 items-center border-b px-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="mx-2 h-4 w-24 flex-1" />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex h-14 items-center border-b px-4 last:border-b-0"
              >
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton
                    key={j}
                    className="mx-2 h-4 w-full max-w-[180px] flex-1"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// ATTENDANCE — Header + 4 stats + progress + 2-col dashboard + quick links
// =============================================================================

export function AttendanceSkeleton() {
  return (
    <div className="flex flex-col gap-6 pb-14">
      {/* Header: date/title + button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="mb-2 h-4 w-16" />
              <Skeleton className="h-8 w-12" />
              <Skeleton className="mt-1 h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress card */}
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
          <Skeleton className="h-4 w-16" />
        </CardContent>
      </Card>

      {/* 2-col: My Classes + Needs Attention */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick links: 4-button grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// SUBJECTS BROWSE — responsive card grid (shared by all, elementary, middle, high)
// =============================================================================

export function SubjectsBrowseSkeleton() {
  return (
    <div className="space-y-6">
      <div className="@container">
        <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2 @2xl:grid-cols-3 @5xl:grid-cols-4">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 overflow-hidden rounded-lg border"
            >
              <Skeleton className="h-16 w-16 shrink-0 rounded-s-lg rounded-e-none" />
              <div className="min-w-0 pe-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-1 h-3.5 w-14 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// SUBJECT DETAIL — topics heading + horizontal scroll of topic cards
// =============================================================================

export function SubjectDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* ── Chapters heading + "See all" ── */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-14" />
      </div>

      {/* ── Chapter pill cards (ExploreAll + 5 topics) ── */}
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex w-52 shrink-0 items-center gap-3 overflow-hidden rounded-lg border"
          >
            <Skeleton className="h-14 w-14 shrink-0 rounded-s-lg" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      {/* ── Content sections (mt-8 space-y-8 in real component) ── */}
      <div className="mt-8 space-y-8">
        {/* ── Videos section ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-16" />
            <Skeleton className="ms-auto h-4 w-28" />
          </div>
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="relative w-60 shrink-0 overflow-hidden rounded-lg"
              >
                <Skeleton className="aspect-[3/2] w-full rounded-lg" />
                {/* Overlay text placeholder */}
                <div className="absolute inset-x-0 bottom-0 p-2.5">
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-3 w-10" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Materials section (liquid-glass w-44 cards) ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="ms-auto h-4 w-14" />
          </div>
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-44 shrink-0 space-y-2 rounded-xl border p-3"
              >
                <Skeleton className="size-5 rounded-sm" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-14" />
              </div>
            ))}
          </div>
        </div>

        {/* ── Exams pipeline section (liquid-glass w-44 cards) ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-14" />
            <Skeleton className="ms-auto h-4 w-14" />
          </div>
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-44 shrink-0 space-y-2 rounded-xl border p-3"
              >
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-14" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── QBank section ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-14" />
            <Skeleton className="ms-auto h-4 w-24" />
          </div>
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="w-[245px] shrink-0 overflow-hidden rounded-xl"
              >
                <Skeleton className="h-10 w-full rounded-none" />
                <Skeleton className="h-[250px] w-full rounded-none" />
              </div>
            ))}
          </div>
        </div>

        {/* ── Assignments section ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-24" />
          </div>
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="w-56 shrink-0 space-y-2 rounded-lg border p-3"
              >
                <Skeleton className="h-4 w-14 rounded-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// SUBJECT PICKER — search + filter + selectable card grid
// =============================================================================

export function SubjectPickerSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search + 2 filter selects */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <Skeleton className="h-10 w-[160px] rounded-md" />
        <Skeleton className="h-10 w-[180px] rounded-md" />
      </div>

      {/* Department heading */}
      <Skeleton className="h-4 w-24" />

      {/* Card grid — vertical cards with color banner */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            {/* Color banner */}
            <Skeleton className="h-24 w-full rounded-none" />
            {/* Card content */}
            <CardContent className="p-3">
              <Skeleton className="h-4 w-full" />
              <div className="mt-1 flex items-center gap-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// SUBJECT CONTRIBUTE FORM — card with cascading selects + fields (shared by 3 routes)
// =============================================================================

export function SubjectContributeFormSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 3-col cascade selects */}
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
        </div>

        {/* Form fields */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className={i % 2 === 0 ? "h-10 w-full" : "h-20 w-full"} />
          </div>
        ))}

        {/* Multi-col row (question: 4 cols, assignment/material: 3 or 2 cols) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
        </div>

        {/* Tags + submit */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// SUBJECT CONTRIBUTIONS — tabs (3) + table inside each tab
// =============================================================================

export function SubjectContributionsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="bg-muted inline-flex gap-1 rounded-md p-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-28 rounded-sm" />
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
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
            {Array.from({ length: 6 }).map((_, j) => (
              <Skeleton
                key={j}
                className="mx-2 h-4 w-full max-w-[150px] flex-1"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// EXAM CERTIFICATE CONFIGS LIST — header + button + table
// =============================================================================

export function ExamCertConfigListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="mt-1 h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-40 rounded-md" />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <div className="bg-muted/50 flex h-12 items-center border-b px-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="mx-2 h-4 w-24 flex-1" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
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

// =============================================================================
// EXAM CERTIFICATE CONFIG FORM — multi-section form (no max-width)
// =============================================================================

export function ExamCertConfigFormSkeleton() {
  return (
    <div className="space-y-8">
      {/* 2-col row: name + type */}
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>

      {/* Textarea: description */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-20 w-full rounded-md" />
      </div>

      {/* 3-col row: style, orientation, border */}
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>

      {/* 2-col row: title EN + AR */}
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>

      {/* 2 body textareas: EN + AR */}
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-24 w-full rounded-md" />
        </div>
      ))}

      {/* 3-col row: min percentage, min grade, top percentile */}
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>

      {/* Signatures section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-10 flex-1 rounded-md" />
            <Skeleton className="h-10 flex-1 rounded-md" />
          </div>
        ))}
      </div>

      {/* 2-col switches: logo + verification */}
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center space-x-2 rtl:space-x-reverse"
          >
            <Skeleton className="h-5 w-10 rounded-full" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>

      {/* 2-col row: verification prefix + expiry */}
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-28 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
    </div>
  )
}

// =============================================================================
// EXAM CERTIFICATE VERIFY — centered result card
// =============================================================================

export function ExamCertVerifySkeleton() {
  return (
    <div className="mx-auto max-w-lg space-y-6 py-12">
      {/* Centered icon + heading */}
      <div className="flex flex-col items-center space-y-3">
        <Skeleton className="size-16 rounded-full" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Details card */}
      <div className="space-y-4 rounded-lg border p-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// EXAM PROGRESS — header + button + 3 stats + schedule list
// =============================================================================

export function ExamProgressSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-1 h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
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

      {/* Schedule list cards */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// EXAM QUICK LIST — header + button + 4 stats + assessment cards
// =============================================================================

export function ExamQuickListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-44" />
          <Skeleton className="mt-1 h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-40 rounded-md" />
      </div>

      {/* 4 stat cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
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

      {/* Assessment list cards */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="space-y-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-64" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// EXAM QUICK TAKE — centered header + timer + question cards + submit
// =============================================================================

export function ExamQuickTakeSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      {/* Header + timer */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-56" />
          <Skeleton className="mt-1 h-4 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-5" />
          <Skeleton className="h-6 w-20 font-mono" />
        </div>
      </div>

      {/* Question cards */}
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-1 h-5 w-full" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3">
                <Skeleton className="size-4 rounded-full" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Submit */}
      <div className="flex justify-end">
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
    </div>
  )
}

// =============================================================================
// COMMUNICATION BROADCAST — form card + recent batches
// =============================================================================

export function CommunicationBroadcastSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left: Send form card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="size-5" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Notification type */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>

          {/* Target row: role + class */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>

          {/* Send button */}
          <Skeleton className="h-10 w-full rounded-md" />
        </CardContent>
      </Card>

      {/* Right: Recent broadcasts card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-16" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-start justify-between rounded-lg border p-3"
            >
              <div className="space-y-1">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// COMMUNICATION SETTINGS — 3 card sections with switch/select/input rows
// =============================================================================

export function CommunicationSettingsSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                {j % 2 === 0 ? (
                  <Skeleton className="h-5 w-10 rounded-full" />
                ) : (
                  <Skeleton className="h-9 w-[140px] rounded-md" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
    </div>
  )
}

// =============================================================================
// COMMUNICATION TEMPLATES — header + button + table
// =============================================================================

// =============================================================================
// LIBRARY CATALOG — search + genre filter + card grid (book picker)
// =============================================================================

export function LibraryCatalogSkeleton() {
  return (
    <div className="space-y-6">
      {/* Contribute button */}
      <div className="flex justify-end">
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>

      {/* Description */}
      <Skeleton className="h-4 w-72" />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <Skeleton className="h-10 w-[200px] rounded-md" />
      </div>

      {/* Genre heading */}
      <Skeleton className="h-3 w-20" />

      {/* Book card grid */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-24 w-full rounded-none" />
            <CardContent className="p-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="mt-1 h-3 w-3/4" />
              <div className="mt-1 flex items-center gap-3">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// LIBRARY CONTRIBUTE — card with 2-col form fields
// =============================================================================

export function LibraryContributeSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 2-col form grid — 6 rows of 2 fields each */}
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
        </div>

        {/* Full-width: Tags */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        {/* Full-width: Description textarea */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-20 w-full rounded-md" />
        </div>

        {/* Full-width: Summary textarea */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-16 w-full rounded-md" />
        </div>

        {/* Buttons */}
        <div className="mt-6 flex gap-3">
          <Skeleton className="h-10 w-20 rounded-md" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// LIBRARY CONTRIBUTIONS — header + button + 5-col table
// =============================================================================

export function LibraryContributionsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-1 h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-44 rounded-md" />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
        <div className="bg-muted/50 flex h-12 items-center border-b px-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="mx-2 h-4 w-24 flex-1" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex h-14 items-center border-b px-4 last:border-b-0"
          >
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
  )
}

// =============================================================================
// SUBJECT CHAPTERS — 2-col: chapter sections (heading + lesson card grid) + sidebar
// =============================================================================

export function SubjectChaptersSkeleton() {
  return (
    <div className="flex gap-8">
      {/* Main content */}
      <div className="min-w-0 flex-1 space-y-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <section key={i} className="space-y-2">
            {/* Chapter heading */}
            <Skeleton className="h-6 w-48" />
            {/* Lesson card grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-start gap-3">
                  <Skeleton className="h-[72px] w-[72px] shrink-0 rounded-sm" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Bottom CTA bar */}
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>

      {/* Sidebar */}
      <div className="hidden w-48 shrink-0 lg:block">
        <Skeleton className="h-4 w-32" />
        <div className="mt-3 space-y-2 border-s ps-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-28" />
          ))}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// SUBJECT MATERIALS — 2-col: material type sections (heading + card grid) + sidebar
// =============================================================================

export function SubjectMaterialsSkeleton() {
  return (
    <div className="flex gap-8">
      {/* Main content */}
      <div className="min-w-0 flex-1 space-y-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <section key={i}>
            {/* Type heading */}
            <Skeleton className="mb-4 h-6 w-36" />
            {/* Material card grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div
                  key={j}
                  className="flex items-center gap-3 rounded-lg border"
                >
                  <Skeleton className="h-14 w-14 shrink-0 rounded-s-lg rounded-e-none" />
                  <div className="min-w-0 flex-1 pe-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="mt-1 h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Bottom CTA bar */}
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>

      {/* Sidebar */}
      <div className="hidden w-48 shrink-0 lg:block">
        <Skeleton className="h-4 w-32" />
        <div className="mt-3 space-y-2 border-s ps-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// EXAM CATALOG BROWSE — heading + filter bar + 3-col card grid
// =============================================================================

export function ExamCatalogBrowseSkeleton() {
  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <Skeleton className="h-8 w-36" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <Skeleton className="h-10 w-[200px] rounded-md" />
        <Skeleton className="h-10 w-[160px] rounded-md" />
      </div>

      {/* Exam card grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Badge row */}
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              {/* Stats row */}
              <div className="flex items-center gap-4 text-xs">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-3 w-16" />
              </div>
              {/* Buttons */}
              <div className="flex gap-2">
                <Skeleton className="h-8 flex-1 rounded-md" />
                <Skeleton className="h-8 flex-1 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// EXAM CONTRIBUTIONS — heading + 4 stats + tabs + contribution cards
// =============================================================================

export function ExamContributionsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <Skeleton className="h-8 w-44" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>

      {/* Inner heading */}
      <div>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-1 h-4 w-56" />
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="size-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-muted inline-flex gap-1 rounded-md p-1">
        <Skeleton className="h-8 w-24 rounded-sm" />
        <Skeleton className="h-8 w-28 rounded-sm" />
      </div>

      {/* Contribution cards */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-start justify-between gap-4 pt-6">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-32" />
                <div className="flex flex-wrap gap-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// EXAM VERSIONS — heading + header row + 3-col version card grid
// =============================================================================

export function ExamVersionsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <Skeleton className="h-8 w-36" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-6 w-36" />
          <Skeleton className="mt-1 h-4 w-20" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Version card grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <Skeleton className="h-5 w-24" />
                {i === 0 && <Skeleton className="h-5 w-14 rounded-full" />}
              </div>
              <Skeleton className="h-3 w-20" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4 text-sm">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 flex-1 rounded-md" />
                <Skeleton className="size-8 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// STREAM ENROLLMENTS — header + badge + card with 6-col table
// =============================================================================

export function LumosEnrollmentsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-36" />
          <Skeleton className="mt-1 h-4 w-48" />
        </div>
        <Skeleton className="h-6 w-12 rounded-full" />
      </div>

      {/* Card with table */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="bg-muted/50 flex h-12 items-center border-b px-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="mx-2 h-4 w-20 flex-1" />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex h-14 items-center border-b px-4 last:border-b-0"
              >
                {Array.from({ length: 6 }).map((_, j) => (
                  <Skeleton
                    key={j}
                    className="mx-2 h-4 w-full max-w-[140px] flex-1"
                  />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// STREAM TEACH OVERVIEW — header + button + 4 stats + quick actions card
// =============================================================================

export function LumosTeachOverviewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-44" />
          <Skeleton className="mt-1 h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      {/* 4 stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-9 w-36 rounded-md" />
            <Skeleton className="h-9 w-32 rounded-md" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// STREAM TEACH VIDEOS — header + badge + card with 7-col table
// =============================================================================

export function LumosTeachVideosSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-6 w-12 rounded-full" />
      </div>

      {/* Card with table */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="bg-muted/50 flex h-12 items-center border-b px-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="mx-2 h-4 w-16 flex-1" />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex h-14 items-center border-b px-4 last:border-b-0"
              >
                {Array.from({ length: 7 }).map((_, j) => (
                  <Skeleton
                    key={j}
                    className="mx-2 h-4 w-full max-w-[120px] flex-1"
                  />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function CommunicationTemplatesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-36" />
          <Skeleton className="mt-1 h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
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
  )
}

// =============================================================================
// DASHBOARD — the phone prefix every role gets, then that role's own sections
// =============================================================================

/**
 * `/dashboard` is not one page, it is one page with a different tail per role —
 * `content.tsx` switches on the session's role, and since 2026-09-12 every
 * branch opens with the SAME four sections in the same order: Quick Actions,
 * the charts, Resource Usage, Invoice History. That is what makes an accurate
 * skeleton possible at all; before it, six orders meant a skeleton that was
 * right for one role was actively wrong for the other five.
 *
 * The shape is still a prop, because the four sections are shared but not
 * identical and the tails differ. `page.tsx` reads the role off the session — a
 * JWT cookie read, no database — and hands it in through its own `<Suspense>`,
 * the only place on the route where the role is known before the data lands.
 * The route's own `loading.tsx` renders this with NO role, which now costs
 * almost nothing: it draws the four shared sections and stops before the tail.
 *
 * What varies, measured in a browser at 1440 against every demo role:
 *
 *   charts    884px for every role but the student, whose `chart-section.tsx`
 *             hides the bar and the radial and lets the area chart take the row
 *             alone — 498px.
 *   usage     four rows (234px) for every role but the student's three (197px).
 *   tail      ADMIN and DEVELOPER have none at all, since the attendance grid
 *             that stood there was removed. STUDENT and TEACHER share one
 *             `md`-and-up metric tile and the classes card. GUARDIAN, STAFF and
 *             ACCOUNTANT each open their tail with the same four-tile metric
 *             row (114px) and then go their own ways, which is where this file
 *             stops drawing — the rest of those three tails is five to seven
 *             grids of different heights per role, and a card drawn at the
 *             wrong height is worse than a card left out.
 *
 * The invoice section is deliberately drawn at one size for everyone though the
 * real one measures 183px empty and 576px with rows: which it will be depends
 * on data this skeleton cannot see.
 *
 * Every measurement below is off the components themselves, not estimated: the
 * 250px bar-chart plot, the `p-2` table rows, the `h-14` action tile. Where a
 * section hides itself at a breakpoint (`hidden md:block` on Quick Actions,
 * `md:hidden` on the whole phone prefix) the placeholder carries the SAME
 * query, so neither width paints a section the page is about to drop.
 */

type DashboardShape = "ADMIN" | "LEARNER" | "STAFFROOM"

/**
 * Which of the three tails a role gets. The four sections above the tail are
 * the same whatever this returns, so an unrecognised role is not a hole any
 * more — it is the shared page without a tail.
 */
function dashboardShape(role?: string | null): DashboardShape | null {
  switch (role) {
    // `content.tsx` sends DEVELOPER to `AdminDashboard` itself, and that
    // dashboard has no tail left.
    case "ADMIN":
    case "DEVELOPER":
      return "ADMIN"
    case "TEACHER":
    case "STUDENT":
      return "LEARNER"
    case "GUARDIAN":
    case "STAFF":
    case "ACCOUNTANT":
      return "STAFFROOM"
    default:
      return null
  }
}

export function DashboardSkeleton({ role }: { role?: string | null } = {}) {
  const shape = dashboardShape(role)
  // The student is the one role whose charts and usage table are shorter — see
  // the note above. Every other role, and an unknown one, takes the full size.
  const student = role === "STUDENT"

  return (
    // `content.tsx`'s own wrapper: the phone prefix and the role dashboard are
    // siblings in a `space-y-6`, and the role dashboard opens its own
    // `space-y-8` inside it.
    <div className="space-y-6">
      <PhonePrefixSkeleton />
      <div className="space-y-8">
        <div className="space-y-6">
          <QuickActionsSkeleton />
          <ChartsSectionSkeleton withBar={!student} withRadial={!student} />
          <UsageSectionSkeleton rows={student ? 3 : 4} />
          <InvoiceSectionSkeleton />
        </div>
        {shape === "LEARNER" ? <LearnerTailSkeleton /> : null}
        {shape === "STAFFROOM" ? <MetricRowSkeleton /> : null}
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// The four blocks every role gets above its own dashboard, all `md:hidden`
// -----------------------------------------------------------------------------

/**
 * The home block, the next-action banner, today's classes and the phone
 * quick-action row.
 *
 * The banner and the class grid can both legitimately render nothing — no
 * ranked action, no school day — so on those days this over-draws by a block.
 * Drawing them is still the better trade: they are present on an ordinary
 * school day, and a skeleton that omits them makes the page jump DOWN when
 * they land, which is the reflow this file exists to prevent.
 */
function PhonePrefixSkeleton() {
  return (
    <div className="space-y-6 md:hidden">
      {/* Home block: calendar widget beside the 2x2 tile cluster, both bleeding
          to the viewport edges and paying 16px back, exactly as
          `home-block-client.tsx` does. The widget has no height of its own —
          the cluster's two rows set the row height and the card fills it. */}
      <div className="mx-[calc(50%-50vw)] grid grid-cols-2 gap-x-8 px-4">
        <div className="flex flex-col gap-[5px]">
          <Skeleton className="flex-1 rounded-[28px]" />
          <Skeleton className="mx-auto h-4 w-12" />
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-[5px]">
              <Skeleton className="aspect-square w-full rounded-[29.2%]" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </div>

      {/* Next-action banner. 245px is its own box: `py-12` either side of a
          two-line `text-3xl/1.35` headline (81px) and the `mt-7` + `h-10`
          pill row under it. */}
      <Skeleton className="h-[245px] w-full rounded-[36px]" />

      {/* Today's classes — the timetable's own day mode, so its own skeleton,
          narrowed to the single day column that card renders. */}
      <div>
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-5 w-24" />
        </div>
        <TimetableGridSkeleton workingDays={[0]} />
      </div>

      {/* Phone quick actions: four Android tiles on the home block's grid. */}
      <div className="mx-[calc(50%-50vw)] px-4">
        <Skeleton className="mb-4 h-7 w-32" />
        <div className="grid grid-cols-4 gap-x-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-[5px]">
              <Skeleton className="aspect-square w-full rounded-[29.2%]" />
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Role tails — what each role puts UNDER the four shared sections
// -----------------------------------------------------------------------------

/**
 * The four-tile metric row that opens the guardian's, the staff member's and
 * the accountant's tail. 114px in all three, measured: a `grid-cols-2`
 * (`lg:grid-cols-4`) of `MetricCard`s, each a title over a value with an icon
 * square on the far side.
 *
 * Their tails continue past it — five to seven more grids apiece, at heights
 * that agree on nothing — and this file stops here rather than guess at them.
 */
function MetricRowSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-9 w-16" />
              </div>
              <Skeleton className="size-10 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * The student's and the teacher's tail: one metric tile in a three-column row
 * (the other two were removed, the row was not) and the classes card. Both are
 * `md`-and-up, so below that breakpoint this draws nothing — which is correct,
 * because below it the phone prefix above already shows the same day as a grid.
 */
function LearnerTailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="hidden gap-4 md:grid md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-9 w-10" />
              </div>
              <Skeleton className="size-10 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's schedule. Four rows: a school day has more, but this card
          lists only what is LEFT of it, so a full seven would over-draw by
          more than four under-draws. */}
      <Card className="hidden md:block">
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 w-32 rounded-md" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-lg border p-3"
            >
              <Skeleton className="h-5 w-16 shrink-0" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
              <Skeleton className="h-6 w-14 shrink-0 rounded-md" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Shared sections
// -----------------------------------------------------------------------------

/** `SectionHeading` — an 18px/28px h2 with a 16px skirt. */
function SectionHeadingSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("mb-4 h-7", className)} />
}

// `HeroSkeleton` and `QuickLookSkeleton` stood here. The Upcoming/Weather hero
// and the Quick Look row they drew are commented out on every role dashboard as
// of 2026-09-12; both placeholders are in this file's history if either comes
// back.

/**
 * Four action tiles. `hidden md:block`, matching the section itself — below
 * `md` the phone row above stands in for it, and drawing both would be the
 * same four destinations twice.
 */
function QuickActionsSkeleton() {
  return (
    <section className="hidden md:block">
      <SectionHeadingSkeleton className="w-32" />
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    </section>
  )
}

/**
 * Resource Usage. Measured on the live page: a 40px header row over 36px rows
 * (`p-2` around a 20px line), and 44px from the top of the heading to the top
 * of the table — the empty title block `DetailedUsageTable` still renders adds
 * nothing, because its margin collapses with the heading's.
 *
 * The row count is knowable: this table paints its role's DEFAULT rows on the
 * first frame and only later swaps in the server's, which for these roles is
 * the same count.
 */
function UsageSectionSkeleton({ rows }: { rows: number }) {
  return (
    <section>
      <SectionHeadingSkeleton className="w-40" />
      <div className="overflow-x-auto rounded-md border">
        <div className="grid h-10 grid-cols-[180px_1fr_1fr_160px] items-center gap-2 border-b px-6">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-10 justify-self-end" />
          <Skeleton className="h-4 w-10 justify-self-end" />
          <Skeleton className="h-4 w-12 justify-self-end" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[180px_1fr_1fr_160px] items-center gap-2 border-b px-6 py-2 last:border-b-0"
          >
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-14 justify-self-end" />
            <Skeleton className="h-5 w-14 justify-self-end" />
            <div className="flex min-w-[120px] items-center gap-2">
              <Skeleton className="h-2 flex-1 rounded-full" />
              <Skeleton className="h-4 w-10" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/**
 * Invoice History: a five-column header over ONE 96px body cell.
 *
 * That single cell is not a shortcut — it is what the page paints when this
 * skeleton hands over. `InvoiceHistorySection` starts with an empty list and
 * fills it from a client-side read, so the frame that replaces this one is the
 * table's own "no invoices yet" row (`h-24`), whatever the reader's invoice
 * count turns out to be. Drawing a guessed number of rows would put a step
 * into the ONE transition this component controls, to avoid a later step it
 * cannot predict.
 */
function InvoiceSectionSkeleton() {
  return (
    <section>
      <SectionHeadingSkeleton className="w-40" />
      <div className="rounded-md border">
        <div className="grid h-10 grid-cols-[120px_1fr_1fr_1fr_1fr] items-center gap-2 border-b px-6">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12 justify-self-end" />
          <Skeleton className="h-4 w-12 justify-self-end" />
          <Skeleton className="h-4 w-12 justify-self-end" />
        </div>
        {/* Five 49px rows. This table is the one section whose real height is
            decided by data the skeleton cannot see: measured at 1440 it is
            183px with no invoices, 429px for the student's seven and 576px for
            the accountant's ten. Five sits between them, so whichever way the
            page lands it moves by a few rows rather than by a whole table —
            the empty-state band that stood here was right only for a school
            with nothing billed. */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="grid h-[49px] grid-cols-[120px_1fr_1fr_1fr_1fr] items-center gap-2 border-b px-6 last:border-b-0"
          >
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16 justify-self-end" />
            <Skeleton className="h-4 w-14 justify-self-end" />
            <Skeleton className="h-4 w-10 justify-self-end" />
          </div>
        ))}
      </div>
    </section>
  )
}

/**
 * The chart section, at its two shapes: full-width bar over a radial/area
 * pair, or the area chart alone across the row.
 */
function ChartsSectionSkeleton({
  withBar = false,
  withRadial = false,
}: {
  withBar?: boolean
  withRadial?: boolean
}) {
  return (
    <section>
      <SectionHeadingSkeleton className="w-44" />
      <div className="space-y-4">
        {withBar ? <BarChartCardSkeleton /> : null}
        <div className={cn("grid gap-4", withRadial && "md:grid-cols-2")}>
          {withRadial ? <RadialChartCardSkeleton /> : null}
          <AreaChartCardSkeleton tall={!withRadial} />
        </div>
      </div>
    </section>
  )
}

/** `chart-interactive-bar.tsx`: split header over a 250px plot. */
function BarChartCardSkeleton() {
  return (
    <Card className="bg-muted border-none shadow-none">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 even:border-s sm:border-s sm:border-t-0 sm:px-8 sm:py-6"
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <Skeleton className="h-[250px] w-full" />
      </CardContent>
    </Card>
  )
}

/** `chart-radial-text.tsx`: a 250px dial over a two-line footer. */
function RadialChartCardSkeleton() {
  return (
    <Card className="bg-muted flex flex-col border-none shadow-none">
      <CardContent className="flex-1 pb-0">
        <Skeleton className="mx-auto aspect-square w-full max-w-[250px] rounded-full" />
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardFooter>
    </Card>
  )
}

/**
 * `chart-area-stacked.tsx`: an empty `CardHeader` above the plot, then the
 * same two-line footer. `tall` is the student's row-wide variant, which pins
 * the plot at 320px instead of letting `aspect-video` double it.
 */
function AreaChartCardSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <Card className="bg-muted flex flex-col border-none shadow-none">
      <CardHeader />
      <CardContent className="flex-1">
        <Skeleton
          className={cn(
            "w-full",
            tall ? "aspect-video md:aspect-auto md:h-[320px]" : "aspect-video"
          )}
        />
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardFooter>
    </Card>
  )
}

// `AttendanceSectionSkeleton` stood here, for the admin's attendance overview.
// That section drew invented numbers and was deleted on 2026-09-12, so there is
// nothing left for it to stand in for.

// =============================================================================
// EXAMS DASHBOARD — Hero + 4 progress + 3 features + results/actions + workflow
// =============================================================================

export function ExamsDashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Hero: Card Flip + 2x2 Stats Grid */}
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-[280px]">
          <CardContent className="flex h-full flex-col justify-between p-5">
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
            <Skeleton className="h-9 w-full rounded-md" />
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-4" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="mt-2 h-8 w-16" />
                <Skeleton className="mt-1 h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 4 Progress Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="py-4">
            <CardContent>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="size-4" />
              </div>
              <Skeleton className="mt-2 h-7 w-12" />
              <Skeleton className="mt-4 h-2 w-full rounded-full" />
              <div className="mt-2 flex items-center justify-between">
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3 Feature Blocks */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Skeleton className="size-9 rounded-lg" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="mt-4 h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-9 flex-1 rounded-md" />
                <Skeleton className="h-9 w-9 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Results + Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="size-9 rounded-lg" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-6 w-36" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-px w-full" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
            </div>
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-9 flex-1 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-md" />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Workflow Guide */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="flex items-center gap-2">
                  <Skeleton className="size-4" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// FINANCE MAIN — Bank card + 2x2 stats + charts + quick look + quick actions
// =============================================================================

export function FinanceMainSkeleton() {
  return (
    <div className="space-y-6">
      {/* Overview: Bank card + 2x2 stat cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3.5 w-3.5" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-5 w-20" />
                <Skeleton className="mt-1 h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="space-y-4">
        <Skeleton className="h-[300px] w-full rounded-lg" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[250px] rounded-lg" />
          <Skeleton className="h-[250px] rounded-lg" />
        </div>
      </div>

      {/* Finance Quick Look: 4 compact cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-10" />
                </div>
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions: 4 action cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// EXAMS GENERATE — 3 stats + 4 presets + 5 action cards + quick start
// =============================================================================

export function ExamsGenerateSkeleton() {
  return (
    <div className="space-y-6">
      {/* 3 Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-16" />
              <Skeleton className="mt-1 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Generate Presets */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-56" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="size-10 rounded-lg" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="mt-2 h-5 w-20" />
                <Skeleton className="h-3 w-full" />
              </CardHeader>
              <CardContent className="pt-0">
                <Skeleton className="h-5 w-14 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-28 rounded-md" />
                <Skeleton className="h-9 w-24 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
        <Card className="md:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-40 rounded-md" />
              <Skeleton className="h-9 w-36 rounded-md" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start Guide */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// CLASSROOMS CONFIGURE — Card with form
// =============================================================================

export function ClassroomsConfigureSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <CardDescription className="space-y-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-lg border p-4"
          >
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        ))}
        <div className="flex justify-end">
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// FINANCE DASHBOARD — header + 8 KPIs + charts + transactions
// =============================================================================

export function FinanceDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>

      {/* 8 KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-24" />
              <Skeleton className="mt-1 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue + Expense Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[300px] rounded-lg" />
        <Skeleton className="h-[300px] rounded-lg" />
      </div>

      {/* Cash flow + Bank accounts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[300px] rounded-lg" />
        <Skeleton className="h-[300px] rounded-lg" />
      </div>

      {/* Transactions + Quick actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <Skeleton className="h-6 w-44" />
          <div className="divide-y rounded-lg border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-28" />
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// FINANCE REPORTS — 4 stats + 8 report cards
// =============================================================================

export function FinanceReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-16" />
              <Skeleton className="mt-1 h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-8 w-full rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// FINANCE RECEIPT — header + 4 stats + view toggle + receipt grid
// =============================================================================

export function FinanceReceiptSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {/* 4 Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Skeleton className="h-10 w-48" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-3 p-4">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
