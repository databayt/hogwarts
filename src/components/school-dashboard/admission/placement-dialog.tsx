"use client"

import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { getAvailableClassesForPlacement, placeStudentInClass } from "./actions"

interface PlacementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicationId: string
  studentName: string
  applyingForClass: string
  onSuccess?: () => void
}

export function PlacementDialog({
  open,
  onOpenChange,
  applicationId,
  studentName,
  applyingForClass,
  onSuccess,
}: PlacementDialogProps) {
  const [classes, setClasses] = useState<
    Array<{
      id: string
      name: string
      enrolledStudents: number
      maxCapacity: number
    }>
  >([])
  const [selectedClassId, setSelectedClassId] = useState("")
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    getAvailableClassesForPlacement({ applyingForClass }).then((res) => {
      if (res.success && res.data) {
        setClasses(res.data)
      }
    })
  }, [open, applyingForClass])

  const handlePlace = () => {
    if (!selectedClassId) return

    startTransition(async () => {
      const result = await placeStudentInClass({
        applicationId,
        classId: selectedClassId,
      })

      if (result.success) {
        toast.success(`${studentName} placed successfully`)
        onOpenChange(false)
        setSelectedClassId("")
        onSuccess?.()
      } else {
        toast.error(result.error || "Failed to place student")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Place Student in Class</DialogTitle>
          <DialogDescription>
            Assign {studentName} (applying for {applyingForClass}) to a class
            section.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => {
                const isFull = cls.enrolledStudents >= cls.maxCapacity
                return (
                  <SelectItem key={cls.id} value={cls.id} disabled={isFull}>
                    <div className="flex items-center gap-2">
                      <span>{cls.name}</span>
                      <Badge
                        variant={isFull ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {cls.enrolledStudents}/{cls.maxCapacity}
                      </Badge>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          {classes.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No classes available. Create class sections first.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handlePlace}
            disabled={!selectedClassId || isPending}
          >
            {isPending ? "Placing..." : "Place Student"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
