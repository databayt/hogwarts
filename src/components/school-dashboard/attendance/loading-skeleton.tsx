"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonStats } from "@/components/atom/loading"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { phone } from "./shared/phone"

export function AttendanceTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="w-full space-y-3">
      {/* Header controls skeleton */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-2">
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-8 w-44" />
            <div className="ms-auto flex items-center gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
          <Skeleton className="h-8 w-32" />
        </CardContent>
      </Card>

      {/* Table skeleton */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Skeleton className="h-4 w-4" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-20" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-32" />
              </TableHead>
              <TableHead className="text-center">
                <Skeleton className="mx-auto h-4 w-16" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-8" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export function AttendanceCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </CardContent>
    </Card>
  )
}

export function AttendanceStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-16" />
            <Skeleton className="mt-1 h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function AttendanceChartSkeleton() {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="flex h-[300px] items-end justify-around gap-2">
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <Skeleton
                className="w-full"
                style={{ height: `${Math.random() * 60 + 40}%` }}
              />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Inline loading state for buttons
export function ButtonLoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-900"></div>
      <span>Loading...</span>
    </div>
  )
}

/**
 * Page-body skeleton for the attendance sub-pages that fetch on the client
 * (ai, analytics, gamification, hall-pass, recent). Mirrors their shared
 * shape: header (title + subtitle + optional action), an optional stat-card
 * row in the page's own grid, an optional full-width tab strip, then the
 * page-specific body passed as children.
 */
export function AttendancePageSkeleton({
  label,
  action = false,
  stats = 0,
  statsColumns = "md:grid-cols-4",
  tabs = false,
  children,
}: {
  /** Translated "Loading…" for screen readers. */
  label?: string
  action?: boolean
  stats?: number
  statsColumns?: string
  tabs?: boolean
  children?: ReactNode
}) {
  return (
    <div role="status" aria-busy="true" className="space-y-6">
      <span className="sr-only">{label ?? "Loading…"}</span>
      <div className="flex items-center justify-between max-md:flex-col max-md:items-start max-md:gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-64 max-w-full" />
        </div>
        {action && <Skeleton className="h-9 w-32 max-md:h-10 max-md:rounded-full" />}
      </div>
      {stats > 0 && (
        <SkeletonStats
          count={stats}
          columns={cn(statsColumns, phone.panel)}
          className="[&>*]:max-md:bg-muted [&>*]:max-md:rounded-none [&>*]:max-md:border-0 [&>*]:max-md:shadow-none"
        />
      )}
      {tabs && <Skeleton className="h-9 w-full" />}
      {children}
    </div>
  )
}
