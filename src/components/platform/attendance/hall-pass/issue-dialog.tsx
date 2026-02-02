/**
 * Issue Pass Dialog
 *
 * Dialog for issuing a new hall pass to a student.
 */
"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { createHallPass } from "./actions"
import { hallPassDestinations, type HallPassDestination } from "./validation"

const destinationLabels: Record<
  HallPassDestination,
  { en: string; ar: string }
> = {
  BATHROOM: { en: "Bathroom", ar: "دورة المياه" },
  NURSE: { en: "Nurse", ar: "العيادة" },
  OFFICE: { en: "Office", ar: "الإدارة" },
  COUNSELOR: { en: "Counselor", ar: "المرشد" },
  LIBRARY: { en: "Library", ar: "المكتبة" },
  LOCKER: { en: "Locker", ar: "الخزانة" },
  WATER_FOUNTAIN: { en: "Water Fountain", ar: "برادة الماء" },
  OTHER: { en: "Other", ar: "أخرى" },
}

interface Student {
  id: string
  name: string
}

interface IssuePassDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classId?: string
  locale: string
  onSuccess: () => void
  students?: Student[]
}

export function IssuePassDialog({
  open,
  onOpenChange,
  classId,
  locale,
  onSuccess,
  students = [],
}: IssuePassDialogProps) {
  const isRTL = locale === "ar"
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Form state
  const [studentId, setStudentId] = useState("")
  const [destination, setDestination] = useState<HallPassDestination | "">("")
  const [destinationNote, setDestinationNote] = useState("")
  const [duration, setDuration] = useState(5)
  const [notes, setNotes] = useState("")

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setStudentId("")
      setDestination("")
      setDestinationNote("")
      setDuration(5)
      setNotes("")
      setError("")
    }
  }, [open])

  const handleSubmit = async () => {
    if (!studentId || !destination || !classId) {
      setError(isRTL ? "جميع الحقول مطلوبة" : "All fields are required")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const result = await createHallPass({
        studentId,
        classId,
        destination,
        destinationNote: destination === "OTHER" ? destinationNote : undefined,
        expectedDuration: duration,
        notes: notes || undefined,
      })

      if (result.success) {
        onOpenChange(false)
        onSuccess()
      } else {
        setError(
          result.error ||
            (isRTL ? "فشل في إصدار التصريح" : "Failed to issue pass")
        )
      }
    } catch {
      setError(isRTL ? "حدث خطأ" : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isRTL ? "إصدار تصريح مرور" : "Issue Hall Pass"}
          </DialogTitle>
          <DialogDescription>
            {isRTL
              ? "اختر الطالب والوجهة لإصدار تصريح"
              : "Select a student and destination to issue a pass"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Student selection */}
          <div className="space-y-2">
            <Label>{isRTL ? "الطالب" : "Student"}</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={isRTL ? "اختر الطالب" : "Select student"}
                />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Destination selection */}
          <div className="space-y-2">
            <Label>{isRTL ? "الوجهة" : "Destination"}</Label>
            <Select
              value={destination}
              onValueChange={(v) => setDestination(v as HallPassDestination)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={isRTL ? "اختر الوجهة" : "Select destination"}
                />
              </SelectTrigger>
              <SelectContent>
                {hallPassDestinations.map((dest) => (
                  <SelectItem key={dest} value={dest}>
                    {destinationLabels[dest][isRTL ? "ar" : "en"]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom destination note for "OTHER" */}
          {destination === "OTHER" && (
            <div className="space-y-2">
              <Label>{isRTL ? "تفاصيل الوجهة" : "Destination details"}</Label>
              <Input
                value={destinationNote}
                onChange={(e) => setDestinationNote(e.target.value)}
                placeholder={isRTL ? "أدخل الوجهة..." : "Enter destination..."}
              />
            </div>
          )}

          {/* Duration */}
          <div className="space-y-2">
            <Label>
              {isRTL ? "المدة المتوقعة (دقائق)" : "Expected duration (minutes)"}
            </Label>
            <div className="flex gap-2">
              {[3, 5, 10, 15].map((mins) => (
                <Button
                  key={mins}
                  type="button"
                  variant={duration === mins ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDuration(mins)}
                >
                  {mins}
                </Button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{isRTL ? "ملاحظات (اختياري)" : "Notes (optional)"}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isRTL ? "أي ملاحظات إضافية..." : "Any additional notes..."
              }
              rows={2}
            />
          </div>

          {/* Error message */}
          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isRTL ? "إلغاء" : "Cancel"}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? isRTL
                ? "جاري الإصدار..."
                : "Issuing..."
              : isRTL
                ? "إصدار التصريح"
                : "Issue Pass"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
