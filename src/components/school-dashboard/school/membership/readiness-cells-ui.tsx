"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Globe, Smartphone } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import type { ReadinessLevel, ReadinessReason } from "../readiness/rules"
import {
  hasClasses,
  levelLabelKey,
  platformLabel,
  reasonHint,
  reasonLabel,
  visibleReasons,
} from "./readiness-cells"
import type { MemberReadinessFields } from "./types"

type Dict = Record<string, string>

const LEVEL_CLASS: Record<ReadinessLevel, string> = {
  ok: "border-transparent bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  warn: "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  bad: "border-transparent bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
}

export function LevelBadge({
  level,
  t,
}: {
  level: ReadinessLevel
  t: Dict
}) {
  return (
    <Badge variant="outline" className={cn("font-medium", LEVEL_CLASS[level])}>
      {t[levelLabelKey(level)] ?? level}
    </Badge>
  )
}

/** Icon-only device marker (grid cards). */
export function DeviceIcon({
  client,
  className,
}: {
  client: MemberReadinessFields["deviceClient"] | undefined
  className?: string
}) {
  if (client === "app")
    return <Smartphone className={cn("h-4 w-4", className)} aria-hidden />
  if (client === "web")
    return <Globe className={cn("h-4 w-4", className)} aria-hidden />
  return null
}

export function DeviceCell({
  member,
  t,
}: {
  member: Partial<Pick<
    MemberReadinessFields,
    "deviceClient" | "devicePlatform" | "appVersion"
  >>
  t: Dict
}) {
  if (member.deviceClient === "app") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs">
        <Smartphone className="h-4 w-4" aria-label={t.readiness_device_app} />
        {member.appVersion != null && (
          <span className="text-muted-foreground tabular-nums" dir="ltr">
            v{member.appVersion}
          </span>
        )}
      </span>
    )
  }
  if (member.deviceClient === "web") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs">
        <Globe className="h-4 w-4" aria-label={t.readiness_device_web} />
        <span className="text-muted-foreground">
          {platformLabel(member.devicePlatform)}
        </span>
      </span>
    )
  }
  return <span className="text-muted-foreground">—</span>
}

export function AttendanceCell({
  role,
  pct,
}: {
  role: string
  pct: number | null | undefined
}) {
  if (!hasClasses(role)) return null
  if (pct == null) return <span className="text-muted-foreground">—</span>
  return (
    <div className="flex min-w-[88px] items-center gap-2">
      <div className="bg-muted h-1.5 w-12 overflow-hidden rounded-full">
        <div
          className={cn(
            "h-full rounded-full",
            pct >= 75 ? "bg-green-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums">{pct}%</span>
    </div>
  )
}

export function StatusCell({
  level,
  reasons,
  t,
}: {
  level: ReadinessLevel | null | undefined
  reasons: ReadinessReason[] | undefined
  t: Dict
}) {
  if (!level) return <span className="text-muted-foreground">—</span>
  const chips = visibleReasons(reasons ?? [])
  return (
    <div className="flex max-w-[260px] flex-wrap items-center gap-1">
      <LevelBadge level={level} t={t} />
      {chips.map((code) => (
        <Tooltip key={code}>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="cursor-help text-[11px]">
              {reasonLabel(t, code)}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-[260px]">
            {reasonHint(t, code)}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}
