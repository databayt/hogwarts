"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Users } from "lucide-react"

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import {
  getAvailableSectionsForPlacement,
  placeStudentInSection,
} from "./actions"

interface SectionOption {
  id: string
  name: string
  enrolledStudents: number
  maxCapacity: number
}

interface PlacementDialogProps {
  applicationId: string
  applicantName: string
  applyingForClass: string
  open: boolean
  onOpenChange: (open: boolean) => void
  dictionary: Dictionary["school"]["admission"]
}

export function PlacementDialog({
  applicationId,
  applicantName,
  applyingForClass,
  open,
  onOpenChange,
  dictionary,
}: PlacementDialogProps) {
  const t = dictionary
  const router = useRouter()
  const [sections, setSections] = useState<SectionOption[]>([])
  const [selectedSection, setSelectedSection] = useState<string>("")
  const [isLoadingSections, setIsLoadingSections] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Fetch sections when dialog opens
  useEffect(() => {
    if (!open) return
    setIsLoadingSections(true)
    getAvailableSectionsForPlacement({ applyingForClass })
      .then((result) => {
        if (result.success && result.data) {
          setSections(result.data)
        } else {
          setSections([])
        }
      })
      .finally(() => setIsLoadingSections(false))
  }, [open, applyingForClass])

  const handlePlace = () => {
    if (!selectedSection) return
    startTransition(async () => {
      const result = await placeStudentInSection({
        applicationId,
        sectionId: selectedSection,
      })
      if (result.success) {
        SuccessToast(
          t?.enrollment?.placementConfirmed || "Student placed in section"
        )
        onOpenChange(false)
        router.refresh()
      } else {
        ErrorToast(result.error || "Failed to place student")
      }
    })
  }

  const seatsLeft = (s: SectionOption) => s.maxCapacity - s.enrolledStudents
  const isFull = (s: SectionOption) => seatsLeft(s) <= 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {t?.enrollment?.assignSection || "Assign Section"}
          </DialogTitle>
          <DialogDescription>
            {applicantName} &mdash; {applyingForClass}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {isLoadingSections ? (
            <p className="text-muted-foreground text-sm">
              {t?.toolbar?.loading || "Loading…"}
            </p>
          ) : sections.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t?.enrollment?.noSectionsAvailable ||
                "No sections available for this year level."}
            </p>
          ) : (
            <RadioGroup
              value={selectedSection}
              onValueChange={setSelectedSection}
              className="space-y-2"
            >
              {sections.map((s) => {
                const full = isFull(s)
                const seats = seatsLeft(s)
                return (
                  <label
                    key={s.id}
                    htmlFor={`section-${s.id}`}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                      full
                        ? "cursor-not-allowed opacity-50"
                        : selectedSection === s.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem
                        value={s.id}
                        id={`section-${s.id}`}
                        disabled={full}
                      />
                      <span className="text-sm font-medium">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="text-muted-foreground h-3.5 w-3.5" />
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {s.enrolledStudents}/{s.maxCapacity}
                      </span>
                      <Badge
                        variant={
                          full
                            ? "destructive"
                            : seats <= 3
                              ? "secondary"
                              : "outline"
                        }
                        className="text-xs"
                      >
                        {full
                          ? t?.enrollment?.sectionFull || "Full"
                          : `${seats} ${t?.enrollment?.seatsLeft || "seats"}`}
                      </Badge>
                    </div>
                  </label>
                )
              })}
            </RadioGroup>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t?.toolbar?.cancel || "Cancel"}
          </Button>
          <Button
            onClick={handlePlace}
            disabled={isPending || !selectedSection || isLoadingSections}
          >
            {isPending
              ? t?.toolbar?.saving || "Saving…"
              : t?.enrollment?.confirmPlacement || "Confirm Placement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
