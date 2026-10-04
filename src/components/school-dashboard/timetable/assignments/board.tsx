"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * School-wide assignment board: one table per grade, sections down the side,
 * the grade's subjects across the top. Each cell is a teacher picker; the
 * column header assigns the subject in every section of the grade at once.
 * Saving runs the assignment engine, so the timetable follows immediately
 * (the action refreshes this page with the new state).
 */
import { useState, useTransition } from "react"
import { Check, ChevronsUpDown, UserX } from "lucide-react"

import { actionErrorMessage } from "@/lib/resolve-action-error"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import {
  confirmDeleteDialog,
  ErrorToast,
  SuccessToast,
  WarningToast,
} from "@/components/atom/toast"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { assignTeacher, unassignTeacher } from "./actions"
import { cellKey } from "./keys"
import type { AssignmentBoardData, AssignmentTeacher } from "./queries"

type Labels = Record<string, string>

const fill = (template: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce(
    (out, [k, v]) => out.replace(`{${k}}`, String(v)),
    template
  )

interface Props {
  data: AssignmentBoardData
}

export function AssignmentBoard({ data }: Props) {
  const { dictionary } = useDictionary()
  const school = dictionary?.school as Record<string, unknown> | undefined
  const t = (school?.timetable as Record<string, unknown> | undefined)
    ?.assignments as Labels | undefined
  const te = (school?.teachers as Record<string, unknown> | undefined)
    ?.subjectsEditor as Labels | undefined
  const [isPending, startTransition] = useTransition()

  const teacherName = new Map(data.teachers.map((x) => [x.teacherId, x.name]))

  const run = (
    subjectId: string,
    sectionIds: string[],
    teacherId: string | null
  ) =>
    startTransition(async () => {
      if (!teacherId) {
        const res = await unassignTeacher({ subjectId, sectionIds })
        if (!res.success) {
          ErrorToast(actionErrorMessage(res.error, dictionary, "Failed"))
        }
        return
      }
      const attempt = async (overrideCap: boolean): Promise<void> => {
        const res = await assignTeacher({
          teacherId,
          subjectId,
          sectionIds,
          overrideCap,
        })
        if (res.success && res.data) {
          const s = res.data
          SuccessToast(
            fill(
              te?.saved ??
                "Saved — {assigned} periods assigned, {moved} moved to make room.",
              { assigned: s.assigned, moved: s.moved }
            )
          )
          if (s.residual.length > 0) {
            WarningToast(
              `${te?.residualTitle ?? "Some periods couldn't be placed"} (${s.residual.length})`
            )
          }
          return
        }
        if (res.error === "TEACHER_OVER_CAP" && !overrideCap) {
          const [load, cap] = (res.details ?? "").split("/")
          const go = await confirmDeleteDialog(undefined, {
            title: te?.overCapTitle ?? "Over the weekly limit",
            description: fill(
              te?.overCapBody ??
                "This gives the teacher {load} periods a week; the limit is {cap}. Assign anyway?",
              { load: load ?? "?", cap: cap ?? "?" }
            ),
            confirmText: te?.assignAnyway ?? "Assign anyway",
            cancelText: te?.cancel ?? "Cancel",
          })
          if (go) await attempt(true)
          return
        }
        ErrorToast(actionErrorMessage(res.error, dictionary, "Failed"))
      }
      await attempt(false)
    })

  if (data.teachers.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        {t?.noTeachers ?? "Add teachers first, then assign them here."}
      </p>
    )
  }
  if (data.grades.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        {t?.noSections ?? "This school has no sections yet."}
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {data.waitingPairs > 0 ? (
          <>
            <Badge variant="outline">
              {fill(
                t?.waitingPairs ?? "{count} subjects waiting for a teacher",
                {
                  count: data.waitingPairs,
                }
              )}
            </Badge>
            {data.waitingPeriods > 0 && (
              <Badge variant="secondary">
                {fill(
                  t?.waitingPeriods ?? "{count} periods without a teacher",
                  {
                    count: data.waitingPeriods,
                  }
                )}
              </Badge>
            )}
          </>
        ) : (
          <Badge variant="secondary">
            {t?.allStaffed ?? "Every subject has a teacher."}
          </Badge>
        )}
      </div>

      {data.grades.map((grade) => (
        <Card key={grade.gradeId}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{grade.name}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-sm">
              <thead>
                <tr>
                  <th className="text-muted-foreground w-24 pe-3 pb-2 text-start text-xs font-medium" />
                  {grade.subjects.map((subject) => {
                    const columnTeachers = new Set(
                      grade.sections.map(
                        (s) =>
                          data.cells[cellKey(s.sectionId, subject.subjectId)]
                            ?.teacherId ?? null
                      )
                    )
                    const shared =
                      columnTeachers.size === 1 ? [...columnTeachers][0] : null
                    return (
                      <th
                        key={subject.subjectId}
                        className="px-1.5 pb-2 text-start align-bottom font-medium"
                      >
                        <div className="flex min-w-36 flex-col gap-1">
                          <span>
                            {subject.name}
                            {subject.weeklyPeriods > 0 && (
                              <span className="text-muted-foreground ms-1 text-xs font-normal">
                                ·{" "}
                                {fill(te?.perWeek ?? "{count}/wk", {
                                  count: subject.weeklyPeriods,
                                })}
                              </span>
                            )}
                          </span>
                          {grade.sections.length > 1 && (
                            <TeacherPicker
                              compact
                              label={t?.allSections ?? "All sections"}
                              title={
                                t?.allSectionsHint ??
                                "Assign this subject in every section of the grade"
                              }
                              value={shared}
                              teachers={data.teachers}
                              subjectId={subject.subjectId}
                              labels={t}
                              disabled={isPending}
                              onChange={(teacherId) =>
                                run(
                                  subject.subjectId,
                                  grade.sections.map((s) => s.sectionId),
                                  teacherId
                                )
                              }
                            />
                          )}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {grade.sections.map((section) => (
                  <tr key={section.sectionId} className="border-t">
                    <th
                      scope="row"
                      title={section.name}
                      className="py-2 pe-3 text-start font-medium whitespace-nowrap"
                    >
                      {section.name}
                    </th>
                    {grade.subjects.map((subject) => {
                      const cell =
                        data.cells[
                          cellKey(section.sectionId, subject.subjectId)
                        ]
                      const teacherId = cell?.teacherId ?? null
                      return (
                        <td
                          key={subject.subjectId}
                          className="px-1.5 py-2 align-top"
                        >
                          <TeacherPicker
                            label={
                              teacherId
                                ? (teacherName.get(teacherId) ?? "—")
                                : (t?.unassigned ?? "No teacher")
                            }
                            value={teacherId}
                            teachers={data.teachers}
                            subjectId={subject.subjectId}
                            labels={t}
                            disabled={isPending}
                            onChange={(next) =>
                              run(subject.subjectId, [section.sectionId], next)
                            }
                          />
                          {cell && cell.scheduled === 0 ? (
                            <p className="text-muted-foreground mt-1 text-xs">
                              {t?.notScheduled ?? "not in the timetable"}
                            </p>
                          ) : teacherId &&
                            cell &&
                            cell.taught < cell.scheduled ? (
                            <p className="text-destructive mt-1 text-xs">
                              {fill(
                                t?.partial ?? "{taught}/{scheduled} periods",
                                {
                                  taught: cell.taught,
                                  scheduled: cell.scheduled,
                                }
                              )}
                            </p>
                          ) : null}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {t?.load ?? "Teacher load"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...data.teachers]
            .sort((a, b) => b.load - a.load || a.name.localeCompare(b.name))
            .map((teacher) => {
              const over = teacher.load > teacher.cap
              return (
                <div key={teacher.teacherId} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{teacher.name}</span>
                    <span
                      className={cn(
                        "shrink-0 tabular-nums",
                        over ? "text-destructive" : "text-muted-foreground"
                      )}
                    >
                      {teacher.load}/{teacher.cap}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(
                      100,
                      teacher.cap > 0 ? (teacher.load / teacher.cap) * 100 : 0
                    )}
                    className={cn("h-1.5", over && "[&>div]:bg-destructive")}
                  />
                </div>
              )
            })}
        </CardContent>
      </Card>
    </div>
  )
}

function TeacherPicker({
  label,
  title,
  value,
  teachers,
  subjectId,
  labels,
  disabled,
  compact,
  onChange,
}: {
  label: string
  title?: string
  value: string | null
  teachers: AssignmentTeacher[]
  subjectId: string
  labels?: Labels
  disabled?: boolean
  compact?: boolean
  onChange: (teacherId: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const qualified = teachers.filter((t) => t.subjectIds.includes(subjectId))
  const others = teachers.filter((t) => !t.subjectIds.includes(subjectId))
  const pick = (teacherId: string | null) => {
    setOpen(false)
    if (teacherId !== value) onChange(teacherId)
  }

  const item = (teacher: AssignmentTeacher) => (
    <CommandItem
      key={teacher.teacherId}
      value={`${teacher.name} ${teacher.teacherId}`}
      onSelect={() => pick(teacher.teacherId)}
    >
      <Check
        className={cn(
          "size-4",
          value === teacher.teacherId ? "opacity-100" : "opacity-0"
        )}
      />
      <span className="truncate">{teacher.name}</span>
      <span
        className={cn(
          "ms-auto text-xs tabular-nums",
          teacher.load >= teacher.cap
            ? "text-destructive"
            : "text-muted-foreground"
        )}
      >
        {teacher.load}/{teacher.cap}
      </span>
    </CommandItem>
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={compact ? "ghost" : "outline"}
          size="sm"
          role="combobox"
          aria-expanded={open}
          title={title}
          disabled={disabled}
          className={cn(
            "h-8 w-full min-w-36 justify-between gap-1 px-2 font-normal",
            !value && !compact && "text-muted-foreground border-dashed",
            compact && "text-muted-foreground h-7 text-xs"
          )}
        >
          <span className="truncate">{label}</span>
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder={labels?.search ?? "Search teachers…"} />
          <CommandList>
            <CommandEmpty>
              {labels?.noMatch ?? "No teacher found."}
            </CommandEmpty>
            {qualified.length > 0 && (
              <CommandGroup
                heading={labels?.qualified ?? "Teaches this subject"}
              >
                {qualified.map(item)}
              </CommandGroup>
            )}
            {others.length > 0 && (
              <CommandGroup heading={labels?.others ?? "Other teachers"}>
                {others.map(item)}
              </CommandGroup>
            )}
            {value && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem value="__remove__" onSelect={() => pick(null)}>
                    <UserX className="size-4" />
                    {labels?.remove ?? "Remove teacher"}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
