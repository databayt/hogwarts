"use client"

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

import { createTeacherAbsence, getTeachersForSelection } from "../actions"
import { ABSENCE_TYPES } from "../constants"

interface Teacher {
  id: string
  label: string
}

interface AbsenceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dictionary?: Record<string, any>
}

export function AbsenceFormDialog({
  open,
  onOpenChange,
  onSuccess,
  dictionary,
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

  const t = dictionary?.substitutions || {}

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
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (endDate < startDate) {
      toast({
        title: "Error",
        description: "End date must be after start date",
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
          title: "Success",
          description: "Absence reported successfully",
        })

        onOpenChange(false)
        onSuccess()
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to report absence",
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
            {t.reportAbsence || "Report Teacher Absence"}
          </DialogTitle>
          <DialogDescription>
            {t.reportAbsenceDescription ||
              "Report a teacher absence to enable substitute assignment"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Teacher Selection */}
          <div className="space-y-2">
            <Label htmlFor="teacher">{t.teacher || "Teacher"}</Label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={t.selectTeacher || "Select teacher"}
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
              {t.absenceType || "Absence Type"}
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
              <Label>{t.startDate || "Start Date"}</Label>
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
                    {startDate ? format(startDate, "PPP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>{t.endDate || "End Date"}</Label>
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
                    {endDate ? format(endDate, "PPP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => (startDate ? date < startDate : false)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">{t.reason || "Reason (Optional)"}</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                t.reasonPlaceholder || "Additional details about the absence..."
              }
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel || "Cancel"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !teacherId || !startDate || !endDate}
          >
            {isPending ? "Submitting..." : t.submit || "Report Absence"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
