"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
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

import {
  getAvailableSectionsForPlacement,
  placeStudentInSection,
} from "./actions"

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
  const [sections, setSections] = useState<
    Array<{
      id: string
      name: string
      enrolledStudents: number
      maxCapacity: number
    }>
  >([])
  const [selectedSectionId, setSelectedSectionId] = useState("")
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    getAvailableSectionsForPlacement({ applyingForClass }).then((res) => {
      if (res.success && res.data) {
        setSections(res.data)
      }
    })
  }, [open, applyingForClass])

  const handlePlace = () => {
    if (!selectedSectionId) return

    startTransition(async () => {
      const result = await placeStudentInSection({
        applicationId,
        sectionId: selectedSectionId,
      })

      if (result.success) {
        toast.success(`${studentName} placed successfully`)
        if (result.warning) {
          toast.warning(result.warning)
        }
        onOpenChange(false)
        setSelectedSectionId("")
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
          <DialogTitle>Place Student in Section</DialogTitle>
          <DialogDescription>
            Assign {studentName} (applying for {applyingForClass}) to a homeroom
            section.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Select
            value={selectedSectionId}
            onValueChange={setSelectedSectionId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a section" />
            </SelectTrigger>
            <SelectContent>
              {sections.map((sec) => {
                const isFull = sec.enrolledStudents >= sec.maxCapacity
                return (
                  <SelectItem key={sec.id} value={sec.id} disabled={isFull}>
                    <div className="flex items-center gap-2">
                      <span>{sec.name}</span>
                      <Badge
                        variant={isFull ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {sec.enrolledStudents}/{sec.maxCapacity}
                      </Badge>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          {sections.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No sections available. Create sections in Classrooms &gt;
              Configure first.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handlePlace}
            disabled={!selectedSectionId || isPending}
          >
            {isPending ? "Placing..." : "Place Student"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
