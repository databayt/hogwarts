"use client"

import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"

import { assignGrade } from "./actions"
import type { MemberRow } from "./columns"

interface GradeAssignDialogProps {
  member: MemberRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  grades: { id: string; name: string }[]
  t: Record<string, string>
}

export function GradeAssignDialog({
  member,
  open,
  onOpenChange,
  onSuccess,
  grades,
  t,
}: GradeAssignDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [selectedGrade, setSelectedGrade] = useState<string>(
    member?.academicGradeId || ""
  )

  const handleSubmit = () => {
    if (!member || !selectedGrade) return

    startTransition(async () => {
      const result = await assignGrade({
        userId: member.id,
        academicGradeId: selectedGrade,
      })

      if (result.success) {
        SuccessToast(t.gradeAssigned || "Grade assigned")
        onOpenChange(false)
        setSelectedGrade("")
        onSuccess()
      } else {
        ErrorToast(
          result.error || t.failedToAssignGrade || "Failed to assign grade"
        )
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.assignGrade || "Assign Grade"}</DialogTitle>
          <DialogDescription>
            {t.assignGradeDescription ||
              `Assign a grade to ${member?.name || "student"}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t.grade || "Grade"}</Label>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger>
                <SelectValue placeholder={t.selectGrade || "Select grade"} />
              </SelectTrigger>
              <SelectContent>
                {grades.map((grade) => (
                  <SelectItem key={grade.id} value={grade.id}>
                    {grade.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel || "Cancel"}
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !selectedGrade}>
            {isPending ? t.saving || "Saving..." : t.confirm || "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
