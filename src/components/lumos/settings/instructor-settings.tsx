"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo, useState, useTransition } from "react"
import { Star } from "lucide-react"
import { toast } from "sonner"

import { resolveActionError } from "@/lib/resolve-action-error"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { InstructorRoster } from "@/components/lumos/settings/queries"
import {
  setInstructorDefault,
  setInstructorEnabled,
  setInstructorLock,
} from "@/components/school-dashboard/listings/subjects/catalog/instructor-actions"

interface InstructorSettingsContentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dictionary: Record<string, any>
  lang: string
  roster: InstructorRoster
}

/** Radix reserves the empty string, so "no lock" needs a real sentinel. */
const LOCK_OFF = "__off__"

export function InstructorSettingsContent({
  dictionary,
  roster,
}: InstructorSettingsContentProps) {
  const d = dictionary?.lumos?.instructors ?? {}
  const brand = dictionary?.lumos?.instructorSwitcher?.hogwarts ?? "balqalam"
  const [isPending, startTransition] = useTransition()

  const [blocked, setBlocked] = useState<Set<string>>(
    () => new Set(roster.rows.filter((r) => r.isBlocked).map((r) => r.key))
  )
  const [defaultKey, setDefaultKey] = useState<string | null>(roster.defaultKey)
  const [lockedKey, setLockedKey] = useState<string | null>(roster.lockedKey)

  // Plain function, not a useMemo: `d` is a fresh object literal whenever the
  // namespace is missing, so memoizing on it would recompute every render
  // anyway.
  const nameOf = (row: InstructorRoster["rows"][number]) =>
    row.isPlatform
      ? (d.platformRow ?? brand)
      : (row.name ?? d.unknownInstructor ?? "Instructor")

  const ownSchoolKey = roster.ownSchool ? `school:${roster.ownSchool.id}` : null

  // What the current lock actually buys, in lessons — shown before an admin
  // commits to it, because a narrow lock is not visible from its name.
  const lockedCoverage = useMemo(() => {
    if (!lockedKey) return null
    if (ownSchoolKey && lockedKey === ownSchoolKey) {
      const lessons = roster.rows
        .filter((r) => r.isOwnSchool && !blocked.has(r.key))
        .reduce((max, r) => Math.max(max, r.lessonCount), 0)
      return lessons
    }
    return roster.rows.find((r) => r.key === lockedKey)?.lessonCount ?? 0
  }, [lockedKey, ownSchoolKey, roster.rows, blocked])

  const run = (
    apply: () => void,
    revert: () => void,
    action: () => Promise<{ success: boolean; error?: string }>
  ) => {
    apply()
    startTransition(async () => {
      const result = await action()
      if (!result.success) {
        revert()
        toast.error(
          result.error
            ? resolveActionError(result.error, dictionary)
            : (d.saveFailed ?? "Couldn't save that change")
        )
      }
    })
  }

  const toggleEnabled = (key: string, enabled: boolean) => {
    const previous = new Set(blocked)
    run(
      () =>
        setBlocked((prev) => {
          const next = new Set(prev)
          if (enabled) next.delete(key)
          else next.add(key)
          return next
        }),
      () => setBlocked(previous),
      () => setInstructorEnabled(key, enabled)
    )
  }

  const toggleDefault = (key: string) => {
    const previous = defaultKey
    const next = defaultKey === key ? null : key
    run(
      () => setDefaultKey(next),
      () => setDefaultKey(previous),
      () => setInstructorDefault(next)
    )
  }

  const changeLock = (value: string) => {
    const previous = lockedKey
    const next = value === LOCK_OFF ? null : value
    run(
      () => setLockedKey(next),
      () => setLockedKey(previous),
      () => setInstructorLock(next)
    )
  }

  if (roster.rows.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">
          {roster.totalLessons === 0
            ? (d.empty ?? "No subjects adopted yet.")
            : (d.emptyInstructors ??
              "No instructor has published a video yet.")}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <label
            htmlFor="instructor-lock"
            className="text-sm leading-none font-medium"
          >
            {d.lockLabel ?? "Lock to one instructor"}
          </label>
          <p className="text-muted-foreground max-w-xl text-sm">
            {d.lockDescription}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lockedKey && lockedCoverage !== null && (
            <span className="text-muted-foreground text-sm">
              {(d.lockedCoverage ?? "Covers {covered} of {total} lessons")
                .replace("{covered}", String(lockedCoverage))
                .replace("{total}", String(roster.totalLessons))}
            </span>
          )}
          <Select
            value={lockedKey ?? LOCK_OFF}
            onValueChange={changeLock}
            disabled={isPending}
          >
            <SelectTrigger id="instructor-lock" className="w-[260px]">
              <SelectValue placeholder={d.lockPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={LOCK_OFF}>
                {d.lockOff ?? "Off — any allowed instructor"}
              </SelectItem>
              {ownSchoolKey && (
                <SelectItem value={ownSchoolKey}>
                  {d.lockOwnSchool ?? "Our own instructors only"}
                </SelectItem>
              )}
              {roster.rows
                .filter((row) => !blocked.has(row.key))
                .map((row) => (
                  <SelectItem key={row.key} value={row.key}>
                    {nameOf(row)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{d.colInstructor ?? "Instructor"}</TableHead>
            <TableHead className="w-24 text-end">
              {d.colSubjects ?? "Subjects"}
            </TableHead>
            <TableHead className="w-32 text-end">
              {d.colLessons ?? "Lessons"}
            </TableHead>
            <TableHead className="w-24 text-end">
              {d.colVideos ?? "Videos"}
            </TableHead>
            <TableHead className="w-20" />
            <TableHead className="w-24 text-end">
              {d.colEnabled ?? "Allowed"}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roster.rows.map((row) => {
            const isBlocked = blocked.has(row.key)
            const isDefault = defaultKey === row.key
            const isLocked = lockedKey === row.key
            const name = nameOf(row)

            return (
              <TableRow key={row.key} className={isBlocked ? "opacity-60" : ""}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarImage src={row.image ?? undefined} alt="" />
                      <AvatarFallback className="text-xs">
                        {name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col leading-tight">
                      <span className="flex items-center gap-2 font-medium">
                        {name}
                        {isDefault && (
                          <Badge variant="secondary">
                            {d.defaultBadge ?? "Default"}
                          </Badge>
                        )}
                        {isLocked && <Badge>{d.lockedBadge ?? "Locked"}</Badge>}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {isBlocked
                          ? d.disabledNote
                          : row.isOwnSchool
                            ? (d.ownSchool ?? row.schoolName)
                            : row.schoolName}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-end tabular-nums">
                  {row.subjectCount}
                </TableCell>
                <TableCell className="text-muted-foreground text-end tabular-nums">
                  {(d.coverage ?? "{covered} of {total}")
                    .replace("{covered}", String(row.lessonCount))
                    .replace("{total}", String(roster.totalLessons))}
                </TableCell>
                <TableCell className="text-end tabular-nums">
                  {row.videoCount}
                </TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isPending || isBlocked}
                        onClick={() => toggleDefault(row.key)}
                        aria-pressed={isDefault}
                        aria-label={
                          isDefault
                            ? (d.clearDefault ?? "Clear default")
                            : (d.makeDefault ?? "Make default")
                        }
                      >
                        <Star
                          className={
                            isDefault
                              ? "fill-primary text-primary size-4"
                              : "text-muted-foreground size-4"
                          }
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isDefault
                        ? (d.clearDefault ?? "Clear default")
                        : (d.makeDefault ?? "Make default")}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="text-end">
                  <Switch
                    name={`instructor-allowed-${row.key}`}
                    checked={!isBlocked}
                    disabled={isPending}
                    onCheckedChange={(checked) =>
                      toggleEnabled(row.key, checked)
                    }
                    aria-label={
                      isBlocked
                        ? (d.enable ?? "Allow this instructor")
                        : (d.disable ?? "Disable this instructor")
                    }
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <p className="text-muted-foreground text-sm">{d.defaultHint}</p>
    </div>
  )
}
