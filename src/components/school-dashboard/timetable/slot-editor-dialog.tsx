"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  BookOpen,
  Calendar,
  CircleAlert,
  Clock,
  MapPin,
  User,
  Users,
} from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { DAYS_OF_WEEK, SUBJECT_COLORS } from "./config"
import {
  ClassroomInfo,
  Period,
  SubjectInfo,
  TeacherInfo,
  TimetableSlot,
} from "./types"
import { findAvailableSlots, validateSlotPlacement } from "./util"
import type { SectionForTimetable } from "./validation"

const slotSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  periodId: z.string().min(1, "Period is required"),
  // Section-first: the cohort being scheduled (legacy classId no longer written)
  sectionId: z.string().min(1, "Section is required"),
  subjectId: z.string().min(1, "Subject is required"),
  teacherId: z.string().min(1, "Teacher is required"),
  classroomId: z.string().min(1, "Classroom is required"),
  isSubstitute: z.boolean().optional(),
  substituteTeacherId: z.string().optional(),
  notes: z.string().optional(),
  recurring: z.boolean().optional(),
  recurringWeeks: z.number().optional(),
})

type SlotFormData = z.infer<typeof slotSchema>

interface SlotEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  slot?: TimetableSlot | null
  initialDay?: number
  initialPeriod?: string
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
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherInfo | null>(
    null
  )
  const [availableTeachers, setAvailableTeachers] =
    useState<TeacherInfo[]>(teachers)
  const [availableRooms, setAvailableRooms] =
    useState<ClassroomInfo[]>(classrooms)
  const [showSubstitute, setShowSubstitute] = useState(false)

  const form = useForm<SlotFormData>({
    resolver: zodResolver(slotSchema),
    defaultValues: {
      dayOfWeek: slot?.dayOfWeek ?? initialDay ?? workingDays[0],
      periodId: slot?.periodId ?? initialPeriod ?? "",
      sectionId: slot?.sectionId ?? "",
      subjectId: slot?.subjectId ?? "",
      teacherId: slot?.teacherId ?? "",
      classroomId: slot?.classroomId ?? "",
      isSubstitute: slot?.isSubstitute ?? false,
      substituteTeacherId: slot?.substituteTeacherId ?? "",
      notes: slot?.notes ?? "",
      recurring: false,
      recurringWeeks: 1,
    },
  })

  useEffect(() => {
    if (slot) {
      form.reset({
        dayOfWeek: slot.dayOfWeek,
        periodId: slot.periodId,
        // Legacy classId rows have no sectionId — admin picks one, migrating
        // the row in place on save.
        sectionId: slot.sectionId || "",
        subjectId: slot.subjectId || "",
        teacherId: slot.teacherId || "",
        classroomId: slot.classroomId || "",
        isSubstitute: slot.isSubstitute || false,
        substituteTeacherId: slot.substituteTeacherId || "",
        notes: slot.notes || "",
      })
      setShowSubstitute(slot.isSubstitute || false)
    }
  }, [slot, form])

  useEffect(() => {
    const subjectId = form.watch("subjectId")
    if (subjectId) {
      const subject = subjects.find((s) => s.id === subjectId)
      setSelectedSubject(subject || null)

      // ListFilter teachers who can teach this subject
      const qualifiedTeachers = teachers.filter((t) =>
        t.subjects.includes(subjectId)
      )
      setAvailableTeachers(qualifiedTeachers)
    }
  }, [form.watch("subjectId"), subjects, teachers])

  useEffect(() => {
    const teacherId = form.watch("teacherId")
    if (teacherId) {
      const teacher = teachers.find((t) => t.id === teacherId)
      setSelectedTeacher(teacher || null)
    }
  }, [form.watch("teacherId"), teachers])

  useEffect(() => {
    const dayOfWeek = form.watch("dayOfWeek")
    const periodId = form.watch("periodId")

    if (dayOfWeek !== undefined && periodId) {
      // ListFilter available rooms for this time slot
      const occupiedRooms = existingSlots
        .filter((s) => s.dayOfWeek === dayOfWeek && s.periodId === periodId)
        .map((s) => s.classroomId)
        .filter(Boolean)

      const freeRooms = classrooms.filter((r) => !occupiedRooms.includes(r.id))
      setAvailableRooms(freeRooms)
    }
  }, [
    form.watch("dayOfWeek"),
    form.watch("periodId"),
    existingSlots,
    classrooms,
  ])

  const handleSubmit = async (data: SlotFormData) => {
    setIsLoading(true)
    setValidationErrors([])

    try {
      // Validate slot placement
      const validation = validateSlotPlacement(
        { ...data, id: slot?.id || "new" } as TimetableSlot,
        existingSlots.filter((s) => s.id !== slot?.id)
      )

      if (!validation.valid) {
        setValidationErrors(validation.errors)
        return
      }

      // Handle recurring slots
      if (data.recurring && data.recurringWeeks) {
        const slots: Partial<TimetableSlot>[] = []
        for (let week = 0; week < data.recurringWeeks; week++) {
          slots.push({
            ...data,
            weekOffset: week,
            id: slot?.id,
          })
        }

        // Save all recurring slots
        for (const slotData of slots) {
          await onSave(slotData)
        }
      } else {
        await onSave({
          ...data,
          id: slot?.id,
        })
      }

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
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {slot
              ? (t?.editTitle ?? "Edit Timetable Slot")
              : (t?.addTitle ?? "Add Timetable Slot")}
          </DialogTitle>
          <DialogDescription>
            <p className="muted">
              {t?.description ?? "Configure the timetable slot details"}
            </p>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <CircleAlert className="h-4 w-4" />
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

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">
                  {t?.tabBasicInfo ?? "Basic Info"}
                </TabsTrigger>
                <TabsTrigger value="assignment">
                  {t?.tabAssignment ?? "Assignment"}
                </TabsTrigger>
                <TabsTrigger value="options">
                  {t?.tabOptions ?? "Options"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dayOfWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Calendar className="me-2 inline h-4 w-4" />
                          {t?.dayOfWeek ?? "Day of Week"}
                        </FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(parseInt(value))
                          }
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t?.selectDay ?? "Select day"}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {workingDays.map((day) => (
                              <SelectItem key={day} value={day.toString()}>
                                {DAYS_OF_WEEK[day].name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="periodId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Clock className="me-2 inline h-4 w-4" />
                          {t?.period ?? "Period"}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t?.selectPeriod ?? "Select period"}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {periods.map((period) => (
                              <SelectItem key={period.id} value={period.id}>
                                <div className="flex w-full justify-between">
                                  <span>{period.name}</span>
                                  <small className="text-muted-foreground ms-2">
                                    {period.startTime} - {period.endTime}
                                  </small>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="sectionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Users className="me-2 inline h-4 w-4" />
                        {t?.section ?? "Section"}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
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
              </TabsContent>

              <TabsContent value="assignment" className="space-y-4">
                <FormField
                  control={form.control}
                  name="subjectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <BookOpen className="me-2 inline h-4 w-4" />
                        {t?.subject ?? "Subject"}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t?.selectSubject ?? "Select subject"}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjects.map((subject) => (
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

                <FormField
                  control={form.control}
                  name="teacherId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <User className="me-2 inline h-4 w-4" />
                        {t?.teacher ?? "Teacher"}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
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
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={teacher.photoUrl} />
                                  <AvatarFallback>
                                    {teacher.firstName[0]}
                                    {teacher.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p>
                                    {teacher.firstName} {teacher.lastName}
                                  </p>
                                  <p className="muted">
                                    <small>{teacher.department}</small>
                                  </p>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedTeacher && (
                        <FormDescription>
                          {t?.teaches ?? "Teaches:"}{" "}
                          {selectedTeacher.subjects.join(", ")}
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="classroomId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <MapPin className="me-2 inline h-4 w-4" />
                        {t?.classroom ?? "Classroom"}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
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
                                <div className="flex gap-2">
                                  <Badge variant="secondary">{room.type}</Badge>
                                  {!room.isAvailable && (
                                    <Badge variant="destructive">
                                      {t?.occupied ?? "Occupied"}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="options" className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <h6>{t?.substituteTeacher ?? "Substitute Teacher"}</h6>
                    <p className="muted">
                      <small>
                        {t?.substituteDescription ??
                          "Assign a substitute teacher for this slot"}
                      </small>
                    </p>
                  </div>
                  <Switch
                    checked={showSubstitute}
                    onCheckedChange={setShowSubstitute}
                  />
                </div>

                {showSubstitute && (
                  <FormField
                    control={form.control}
                    name="substituteTeacherId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t?.substituteTeacher ?? "Substitute Teacher"}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  t?.selectSubstitute ?? "Select substitute"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {teachers
                              .filter((t) => t.id !== form.watch("teacherId"))
                              .map((teacher) => (
                                <SelectItem key={teacher.id} value={teacher.id}>
                                  {teacher.firstName} {teacher.lastName}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="recurring"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>
                          {t?.recurringSlot ?? "Recurring Slot"}
                        </FormLabel>
                        <FormDescription>
                          {t?.recurringDescription ??
                            "Create this slot for multiple weeks"}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("recurring") && (
                  <FormField
                    control={form.control}
                    name="recurringWeeks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t?.numberOfWeeks ?? "Number of Weeks"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={52}
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          {t?.weeksDescription ??
                            "How many weeks should this slot repeat?"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t?.notes ?? "Notes"}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={
                            t?.notesPlaceholder ?? "Add any additional notes..."
                          }
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t?.notesDescription ??
                          "Optional notes about this timetable slot"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

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
