import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

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

export function LibrarySkeleton() {
  return (
    <div className="w-full min-w-0 space-y-12 overflow-hidden">
      {/* LibraryHero */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        <div className="flex-1 space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-80" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
        <Skeleton className="h-48 w-48 rounded-xl" />
      </div>

      {/* CollaborateSection */}
      <div className="flex flex-col gap-6 md:flex-row">
        <Skeleton className="h-40 flex-1 rounded-xl" />
        <Skeleton className="h-40 flex-1 rounded-xl" />
      </div>

      {/* 4 BookList rows */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-6 w-36" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 8 }).map((_, j) => (
              <Skeleton
                key={j}
                className="aspect-[2/3] w-32 flex-shrink-0 rounded-lg sm:w-36 md:w-40"
              />
            ))}
          </div>
        </div>
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
      <div className="@container grid grid-cols-1 gap-4 @sm:grid-cols-2 @2xl:grid-cols-3 @5xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-lg border p-4"
          >
            <Skeleton className="size-16 flex-shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
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
      {/* Topics heading + see all link */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>

      {/* Horizontal scroll row of topic cards */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="w-52 flex-shrink-0 space-y-2 rounded-xl border p-3"
          >
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
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
      {/* Search + filter */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 w-[180px] rounded-md" />
      </div>

      {/* Card grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-lg border p-4"
          >
            <Skeleton className="size-12 flex-shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
            <Skeleton className="size-6 rounded" />
          </div>
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

        {/* Multi-col row */}
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
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
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="bg-muted inline-flex gap-1 rounded-md p-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-28 rounded-sm" />
        ))}
      </div>

      {/* Table */}
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
// EXAM CERTIFICATE CONFIG FORM — centered max-w-3xl multi-section form
// =============================================================================

export function ExamCertConfigFormSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-1 h-4 w-64" />
      </div>

      {/* Form sections */}
      <div className="space-y-8">
        {/* 2-col row */}
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
        </div>

        {/* Textarea */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-20 w-full rounded-md" />
        </div>

        {/* 3-col row */}
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
        </div>

        {/* 2 textareas */}
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
        ))}

        {/* 3-col row */}
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
        </div>

        {/* Signatures section */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-24" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-10 flex-1 rounded-md" />
              <Skeleton className="h-10 flex-1 rounded-md" />
              <Skeleton className="h-10 w-10 rounded-md" />
            </div>
          ))}
        </div>

        {/* Switches row */}
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-10 rounded-full" />
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <Skeleton className="h-10 w-24 rounded-md" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
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
    <div className="space-y-6">
      {/* Form card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Type + Title */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>

          {/* Audience selects */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>

          {/* Send button */}
          <div className="flex justify-end">
            <Skeleton className="h-10 w-28 rounded-md" />
          </div>
        </CardContent>
      </Card>

      {/* Recent batches */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
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
