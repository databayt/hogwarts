// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"
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
      {/* Hero — matches hero.tsx layout */}
      <section className="relative">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:gap-16">
          {/* Text Content */}
          <div className="flex flex-1 flex-col items-start space-y-6 text-start">
            {/* h1 "Revelio" + subtitle "Unlock hidden." */}
            <div className="space-y-2">
              <Skeleton className="h-14 w-56 md:h-16 lg:h-20" />
              <Skeleton className="h-8 w-44 md:h-10 lg:h-12" />
            </div>
            {/* Two buttons */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <Skeleton className="h-11 w-36 rounded-md" />
              <Skeleton className="h-11 w-28 rounded-md" />
            </div>
          </div>
          {/* Animation */}
          <div className="flex flex-1 justify-center">
            <Skeleton className="h-56 w-full max-w-md rounded-xl md:h-72" />
          </div>
        </div>
      </section>

      {/* Collaborate — matches collaborate-section.tsx */}
      <section className="w-full max-w-full overflow-hidden rounded-2xl">
        <div className="flex flex-col lg:flex-row">
          {/* Image left */}
          <Skeleton className="aspect-[4/3] w-full lg:aspect-auto lg:h-80 lg:w-1/2" />
          {/* Content right */}
          <div className="flex flex-col justify-center gap-4 p-8 lg:w-1/2 lg:p-12">
            <Skeleton className="h-9 w-3/4 lg:h-10" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="mt-2 h-11 w-28 rounded-md" />
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

export function StreamEnrollmentsSkeleton() {
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

export function StreamTeachOverviewSkeleton() {
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

export function StreamTeachVideosSkeleton() {
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
// DASHBOARD — Hero + QuickLook + QuickActions + ResourceUsage + Charts + Attendance
// =============================================================================

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Hero: Upcoming flip card + Weather */}
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <div className="h-[320px] w-full max-w-[280px] lg:max-w-[320px]">
          <div className="bg-card h-full w-full overflow-hidden rounded-2xl border shadow-sm">
            <div className="from-muted/50 to-background h-full bg-gradient-to-b p-5">
              <div className="flex h-full flex-col justify-end">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="mt-2 h-4 w-48" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-col lg:w-[280px] lg:self-end">
          <div className="space-y-1">
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="mt-2 space-y-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-36" />
            ))}
          </div>
          <div className="mt-3 space-y-0">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="mt-1 h-7 w-32" />
          </div>
          <div className="bg-muted/50 mt-3 flex justify-between gap-4 rounded-lg p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <Skeleton className="h-3 w-6" />
                <Skeleton className="size-5 rounded" />
                <Skeleton className="h-3 w-6" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Look: 4 stat cards (vertical layout) */}
      <div>
        <Skeleton className="mb-4 h-6 w-28" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4">
              <CardContent className="space-y-3 p-0">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions: 4 colored blocks (not Cards) */}
      <div>
        <Skeleton className="mb-4 h-6 w-28" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[60px] rounded-lg" />
          ))}
        </div>
      </div>

      {/* Resource Usage table */}
      <div>
        <Skeleton className="mb-4 h-6 w-36" />
        <div className="overflow-x-auto rounded-md border">
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-full" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-[180px]" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-2 w-[160px] rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invoice History table */}
      <div>
        <Skeleton className="mb-4 h-6 w-36" />
        <div className="overflow-x-auto rounded-md border">
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-full" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts: 1 full-width bar + 2-col (radial + area) */}
      <div>
        <Skeleton className="mb-4 h-6 w-28" />
        <div className="space-y-4">
          <Card className="flex flex-col">
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="flex flex-col">
              <CardHeader>
                <Skeleton className="h-5 w-28" />
              </CardHeader>
              <CardContent>
                <Skeleton className="mx-auto h-[200px] w-[200px] rounded-full" />
              </CardContent>
            </Card>
            <Card className="flex flex-col">
              <CardHeader>
                <Skeleton className="h-5 w-28" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[200px] w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Attendance: 3-col grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="bg-muted flex flex-col border-none shadow-none">
          <CardContent className="flex-1 pb-0">
            <Skeleton className="mx-auto aspect-square max-h-[250px] rounded-full" />
          </CardContent>
        </Card>
        <Card className="bg-muted flex flex-col border-none shadow-none">
          <CardContent className="flex-1 pb-0">
            <Skeleton className="mx-auto aspect-square max-h-[250px] rounded-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-20" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

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
