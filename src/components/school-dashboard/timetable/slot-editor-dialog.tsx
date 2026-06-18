"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { DAYS_OF_WEEK } from "./config"
import {
  ClassroomInfo,
  Period,
  SubjectInfo,
  TeacherInfo,
  TimetableSlot,
} from "./types"
import { validateSlotPlacement } from "./util"
import type { SectionForTimetable } from "./validation"

// Day, period, section, and classroom are auto-detected from the clicked cell
// (and, in the classroom view, the selected room) — they are shown as read-only
// context, not inputs. The only choices the admin makes are the subject and an
// optional teacher (slots may be teacher-less; the name renders once assigned).
const slotSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  periodId: z.string().min(1, "Period is required"),
  // Section-first: the cohort being scheduled (legacy classId no longer written)
  sectionId: z.string().min(1, "Section is required"),
  subjectId: z.string().min(1, "Subject is required"),
  teacherId: z.string().optional(),
  classroomId: z.string().min(1, "Classroom is required"),
})

type SlotFormData = z.infer<typeof slotSchema>

// Period start times are stored as UTC instants (ISO) or plain "HH:MM"; render
// a compact "8:00" without the leading zero on the hour. Returns "" if unknown.
function formatPeriodTime(value?: string): string {
  if (!value) return ""
  const hm = value.match(/^(\d{1,2}):(\d{2})/)
  if (hm) return `${parseInt(hm[1], 10)}:${hm[2]}`
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return `${d.getUTCHours()}:${d.getUTCMinutes().toString().padStart(2, "0")}`
}

interface SlotEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  slot?: TimetableSlot | null
  initialDay?: number
  initialPeriod?: string
  /** Classroom known from the classroom-based admin view — auto-fills the room
   *  and, via the homeroom mapping, the section. */
  initialClassroom?: string
  /** Teacher known from the teacher-based admin view — pre-fills the teacher. */
  initialTeacher?: string
  periods: Period[]
  teachers: TeacherInfo[]
  subjects: SubjectInfo[]
  classrooms: ClassroomInfo[]
  sections: SectionForTimetable[]
  existingSlots: TimetableSlot[]
  workingDays: number[]
  onSave: (data: Partial<TimetableSlot>) => Promise<void>
  dictionary?: any
}

export function SlotEditorDialog({
  open,
  onOpenChange,
  slot,
  initialDay,
  initialPeriod,
  initialClassroom,
  initialTeacher,
  periods,
  teachers,
  subjects,
  classrooms,
  sections,
  existingSlots,
  workingDays,
  onSave,
  dictionary = {},
}: SlotEditorDialogProps) {
  const { dictionary: dict } = useDictionary()
  const t = dict?.school?.timetable?.slotEditor
  const [isLoading, setIsLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [selectedSubject, setSelectedSubject] = useState<SubjectInfo | null>(
    null
  )
  const [availableTeachers, setAvailableTeachers] =
    useState<TeacherInfo[]>(teachers)
  const [availableRooms, setAvailableRooms] =
    useState<ClassroomInfo[]>(classrooms)

  // ---- Auto-detected context -------------------------------------------------
  // Day + period come from the clicked cell; classroom from the selected room
  // (classroom view); section from the room's homeroom mapping. Each is shown
  // read-only when known, and only falls back to a picker when it can't be
  // resolved (e.g. the teacher view, where no room is selected).
  const resolvedDay = slot?.dayOfWeek ?? initialDay ?? workingDays[0]
  const resolvedPeriodId = slot?.periodId ?? initialPeriod ?? ""
  const resolvedClassroomId = slot?.classroomId || initialClassroom || ""
  const autoSection = useMemo(
    () =>
      resolvedClassroomId
        ? sections.find((s) => s.classroomId === resolvedClassroomId)
        : undefined,
    [resolvedClassroomId, sections]
  )
  const resolvedSectionId = slot?.sectionId || autoSection?.id || ""
  const resolvedTeacherId = slot?.teacherId || initialTeacher || ""

  const classroomKnown = Boolean(resolvedClassroomId)
  const sectionKnown = Boolean(resolvedSectionId)

  const periodObj = periods.find((p) => p.id === resolvedPeriodId)
  const classroomObj = classrooms.find((c) => c.id === resolvedClassroomId)
  const sectionObj = sections.find((s) => s.id === resolvedSectionId)

  const form = useForm<SlotFormData>({
    resolver: zodResolver(slotSchema),
    defaultValues: {
      dayOfWeek: resolvedDay,
      periodId: resolvedPeriodId,
      sectionId: resolvedSectionId,
      subjectId: slot?.subjectId ?? "",
      teacherId: resolvedTeacherId,
      classroomId: resolvedClassroomId,
    },
  })

  useEffect(() => {
    form.reset({
      dayOfWeek: resolvedDay,
      periodId: resolvedPeriodId,
      sectionId: resolvedSectionId,
      subjectId: slot?.subjectId ?? "",
      teacherId: resolvedTeacherId,
      classroomId: resolvedClassroomId,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot, initialClassroom, initialTeacher, initialDay, initialPeriod])

  useEffect(() => {
    const subjectId = form.watch("subjectId")
    if (subjectId) {
      const subject = subjects.find((s) => s.id === subjectId)
      setSelectedSubject(subject || null)

      // Filter teachers who can teach this subject
      const qualifiedTeachers = teachers.filter((tt) =>
        tt.subjects.includes(subjectId)
      )
      setAvailableTeachers(
        qualifiedTeachers.length ? qualifiedTeachers : teachers
      )
    } else {
      setAvailableTeachers(teachers)
    }
  }, [form.watch("subjectId"), subjects, teachers])

  useEffect(() => {
    // Only relevant when the classroom is user-selectable (teacher view).
    const occupiedRooms = existingSlots
      .filter(
        (s) => s.dayOfWeek === resolvedDay && s.periodId === resolvedPeriodId
      )
      .map((s) => s.classroomId)
      .filter(Boolean)
    setAvailableRooms(classrooms.filter((r) => !occupiedRooms.includes(r.id)))
  }, [resolvedDay, resolvedPeriodId, existingSlots, classrooms])

  // Subjects are grade-aware: a room maps to a section, a section to a grade, so
  // when the grade is known we show only the subjects selected for it (e.g. A01
  // → Grade 1 → Grade 1 subjects). Falls back to the full list when the grade
  // can't be resolved (teacher view before a section is picked) or when no
  // subject carries grade metadata.
  const watchedSectionId = form.watch("sectionId")
  const gradeFilteredSubjects = useMemo(() => {
    const gradeId = sections.find((s) => s.id === watchedSectionId)?.gradeId
    if (!gradeId) return subjects
    const filtered = subjects.filter(
      (s) => !s.gradeIds?.length || s.gradeIds.includes(gradeId)
    )
    return filtered.length ? filtered : subjects
  }, [subjects, sections, watchedSectionId])

  const handleSubmit = async (data: SlotFormData) => {
    setIsLoading(true)
    setValidationErrors([])

    try {
      const validation = validateSlotPlacement(
        { ...data, id: slot?.id || "new" } as TimetableSlot,
        existingSlots.filter((s) => s.id !== slot?.id)
      )

      if (!validation.valid) {
        setValidationErrors(validation.errors)
        return
      }

      await onSave({ ...data, id: slot?.id })

      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error("Failed to save slot:", error)
      setValidationErrors([
        t?.saveFailed ?? "Failed to save slot. Please try again.",
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-lg overflow-y-auto"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>
            {slot ? (t?.editTitle ?? "Edit slot") : (t?.addTitle ?? "Add slot")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertTitle>
                  {t?.validationError ?? "Validation Error"}
                </AlertTitle>
                <AlertDescription>
                  <ul className="list-disc ps-5">
                    {validationErrors.map((error, i) => (
                      <li key={i}>
                        <p className="muted">{error}</p>
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Auto-detected context (read-only) — values only, dot-separated.
                Period carries its start time; the section is shown as its grade
                (e.g. "Grade 1"), which is what the room maps to. */}
            <div className="bg-muted/40 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border p-3 text-sm font-medium">
              {[
                DAYS_OF_WEEK[resolvedDay]?.name,
                periodObj
                  ? `${periodObj.name}${
                      formatPeriodTime(periodObj.startTime)
                        ? ` (${formatPeriodTime(periodObj.startTime)})`
                        : ""
                    }`
                  : undefined,
                classroomKnown ? classroomObj?.name : undefined,
                sectionKnown ? sectionObj?.gradeName : undefined,
              ]
                .filter(Boolean)
                .map((part, i) => (
                  <span key={i} className="flex items-center gap-x-2">
                    {i > 0 && <span className="text-muted-foreground">·</span>}
                    {part}
                  </span>
                ))}
            </div>

            {/* Section picker — only when it can't be auto-detected (teacher view) */}
            {!sectionKnown && (
              <FormField
                control={form.control}
                name="sectionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t?.section ?? "Section"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t?.selectSection ?? "Select section"}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sections.map((section) => (
                          <SelectItem key={section.id} value={section.id}>
                            <div className="flex w-full items-center justify-between">
                              <span>{section.name}</span>
                              {section.gradeName && (
                                <Badge variant="secondary" className="ms-2">
                                  {section.gradeName}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Subject — the primary choice */}
            <FormField
              control={form.control}
              name="subjectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t?.subject ?? "Subject"}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t?.selectSubject ?? "Select subject"}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {gradeFilteredSubjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-4 w-4 rounded"
                              style={{ backgroundColor: subject.color }}
                            />
                            <span>{subject.name}</span>
                            <Badge variant="outline" className="ms-2">
                              {subject.code}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {selectedSubject &&
                      `${selectedSubject.hoursPerWeek} ${t?.hoursRequired ?? "hours/week required"}`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Teacher — optional; attach now or later */}
            <FormField
              control={form.control}
              name="teacherId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t?.teacher ?? "Teacher"}
                    <span className="text-muted-foreground ms-1 text-xs font-normal">
                      ({t?.optional ?? "optional"})
                    </span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t?.selectTeacher ?? "Select teacher"}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableTeachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name ||
                            `${teacher.firstName} ${teacher.lastName}`.trim()}
                          {teacher.department ? (
                            <span className="text-muted-foreground ms-2 text-xs">
                              {teacher.department}
                            </span>
                          ) : null}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Classroom picker — only when not auto-detected (teacher view) */}
            {!classroomKnown && (
              <FormField
                control={form.control}
                name="classroomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t?.classroom ?? "Classroom"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              t?.selectClassroom ?? "Select classroom"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableRooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            <div className="flex w-full items-center justify-between">
                              <span>{room.name}</span>
                              <Badge variant="secondary">{room.type}</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {t?.cancel ?? "Cancel"}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? (t?.saving ?? "Saving...")
                  : slot
                    ? (t?.update ?? "Update")
                    : (t?.create ?? "Create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
