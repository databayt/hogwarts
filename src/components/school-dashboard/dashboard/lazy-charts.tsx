"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"

import { Skeleton } from "@/components/ui/skeleton"

import type { ChartSectionProps } from "./chart-section"

/**
 * The dashboard's recharts-based sections, loaded as their own chunks.
 *
 * Every role dashboard imported them statically, so recharts (~310 KB gzip)
 * sat in the initial JS of /dashboard — downloaded and parsed before any of
 * the page could hydrate, for a section that renders below the quick actions.
 * The charts draw through ResponsiveContainer, which renders nothing on the
 * server, so server-rendering them only ever produced an empty box.
 *
 * ChartSection (every role) now loads when it comes within 300px of the
 * viewport, behind a skeleton of its size; the role-specific charts load as
 * next/dynamic chunks referenced only by the dashboards that render them.
 */
const ChartSectionChunk = dynamic(
  () => import("./chart-section").then((m) => m.ChartSection),
  { ssr: false, loading: () => <ChartSectionSkeleton /> }
)

function ChartSectionSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2" aria-hidden>
      <Skeleton className="h-[300px] w-full rounded-xl" />
      <Skeleton className="h-[300px] w-full rounded-xl max-md:hidden" />
    </div>
  )
}

export function ChartSection(props: ChartSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || near) return
    if (typeof IntersectionObserver === "undefined") {
      setNear(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true)
          io.disconnect()
        }
      },
      { rootMargin: "300px 0px" }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [near])

  return (
    <div ref={ref}>
      {near ? <ChartSectionChunk {...props} /> : <ChartSectionSkeleton />}
    </div>
  )
}

export const PerformanceGauge = dynamic(() =>
  import("./performance-gauge").then((m) => m.PerformanceGauge)
)

export const ComparisonLineChart = dynamic(() =>
  import("./comparison-chart").then((m) => m.ComparisonLineChart)
)

export const WeeklyActivityChart = dynamic(() =>
  import("./weekly-chart").then((m) => m.WeeklyActivityChart)
)
