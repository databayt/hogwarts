"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useState, useTransition } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { createTeacherAbsence, getTeachersForSelection } from "../actions"
import { ABSENCE_TYPES } from "../config"

interface Teacher {
  id: string
  label: string
}

interface AbsenceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AbsenceFormDialog({
  open,
  onOpenChange,
  onSuccess,
}: AbsenceFormDialogProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [teacherId, setTeacherId] = useState("")
  const [absenceType, setAbsenceType] =
    useState<keyof typeof ABSENCE_TYPES>("SICK")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [reason, setReason] = useState("")
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const { dictionary } = useDictionary()

  const t = dictionary?.school?.timetable?.substitutions

  useEffect(() => {
    if (open) {
      getTeachersForSelection({})
        .then((result) => {
          setTeachers(result.teachers)
        })
        .catch(console.error)

      // Reset form
      setTeacherId("")
      setAbsenceType("SICK")
      setStartDate(undefined)
      setEndDate(undefined)
      setReason("")
    }
  }, [open])

  const handleSubmit = useCallback(() => {
    if (!teacherId || !startDate || !endDate) {
      toast({
        title: t?.toast?.error_title ?? "Error",
        description:
          t?.toast?.errorRequiredFields ?? "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (endDate < startDate) {
      toast({
        title: t?.toast?.error_title ?? "Error",
        description:
          t?.toast?.errorEndDate ?? "End date must be after start date",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        await createTeacherAbsence({
          teacherId,
          startDate,
          endDate,
          absenceType,
          reason: reason.trim() || undefined,
        })

        toast({
          title: t?.toast?.success ?? "Success",
          description:
            t?.toast?.absenceReported ?? "Absence reported successfully",
        })

        onOpenChange(false)
        onSuccess()
      } catch (error) {
        toast({
          title: t?.toast?.error_title ?? "Error",
          description:
            error instanceof Error
              ? error.message
              : (t?.toast?.errorReportAbsence ?? "Failed to report absence"),
          variant: "destructive",
        })
      }
    })
  }, [
    teacherId,
    startDate,
    endDate,
    absenceType,
    reason,
    onOpenChange,
    onSuccess,
    toast,
  ])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {t?.dialog?.reportAbsence ?? "Report Teacher Absence"}
          </DialogTitle>
          <DialogDescription>
            {t?.dialog?.reportAbsenceDescription ??
              "Report a teacher absence to enable substitute assignment"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Teacher Selection */}
          <div className="space-y-2">
            <Label htmlFor="teacher">{t?.form?.teacher ?? "Teacher"}</Label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={t?.form?.selectTeacher ?? "Select teacher"}
                />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Absence Type */}
          <div className="space-y-2">
            <Label htmlFor="absenceType">
              {t?.form?.absenceType ?? "Absence Type"}
            </Label>
            <Select
              value={absenceType}
              onValueChange={(v) =>
                setAbsenceType(v as keyof typeof ABSENCE_TYPES)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ABSENCE_TYPES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t?.form?.startDate ?? "Start Date"}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-start font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="me-2 h-4 w-4" />
                    {startDate
                      ? format(startDate, "PPP")
                      : (t?.form?.pickDate ?? "Pick date")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>{t?.form?.endDate ?? "End Date"}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-start font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="me-2 h-4 w-4" />
                    {endDate
                      ? format(endDate, "PPP")
                      : (t?.form?.pickDate ?? "Pick date")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => (startDate ? date < startDate : false)}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              {t?.form?.reason ?? "Reason (Optional)"}
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                t?.form?.reasonPlaceholder ??
                "Additional details about the absence..."
              }
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t?.buttons?.cancel ?? "Cancel"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !teacherId || !startDate || !endDate}
          >
            {isPending
              ? (t?.content?.submitting ?? "Submitting...")
              : (t?.buttons?.reportAbsence ?? "Report Absence")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
