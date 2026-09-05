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

/**
 * Dict-first mapping for admission action error CODES (see ACTION_ERRORS in
 * src/lib/action-errors.ts) — a raw code like "SECTION_AT_CAPACITY" must
 * never reach the toast. New keys are staged under
 * dictionary.school.admission.errors (see dictkeys-dashboard.json) — cast
 * defensively until the dictionary JSON carries them.
 */
function resolveAdmissionErrorMessage(
  code: string | undefined,
  dictionary: Dictionary["school"]["admission"]
): string {
  const staged = dictionary as unknown as {
    errors?: {
      forbidden?: string
      sectionAtCapacity?: string
      validationError?: string
      generic?: string
    }
  }
  const e = staged.errors
  switch (code) {
    case "FORBIDDEN":
      return e?.forbidden || "You don't have permission to do this."
    case "SECTION_AT_CAPACITY":
      return (
        e?.sectionAtCapacity || "This section is full. Choose another section."
      )
    case "VALIDATION_ERROR":
      return e?.validationError || "Please check your input and try again."
    default:
      return e?.generic || "Something went wrong. Please try again."
  }
}

interface SectionOption {
  id: string
  name: string
  enrolledStudents: number
  maxCapacity: number
}

interface PlacementDialogProps {
  /** PORTAL path (Enrollment tab): place by the ADMITTED application. */
  applicationId?: string
  /** Any-channel path (students list): place the Student directly. */
  studentId?: string
  applicantName: string
  /** Grade label for the header and, without `gradeId`, the section match. */
  applyingForClass?: string
  /** Exact AcademicGrade — preferred for the section match when known. */
  gradeId?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  dictionary: Dictionary["school"]["admission"]
  /** Fires after a successful placement (the dialog also refreshes the router). */
  onPlaced?: () => void
}

export function PlacementDialog({
  applicationId,
  studentId,
  applicantName,
  applyingForClass,
  gradeId,
  open,
  onOpenChange,
  dictionary,
  onPlaced,
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
    getAvailableSectionsForPlacement({ applyingForClass, gradeId })
      .then((result) => {
        if (result.success && result.data) {
          setSections(result.data)
        } else {
          setSections([])
        }
      })
      .finally(() => setIsLoadingSections(false))
  }, [open, applyingForClass, gradeId])

  const handlePlace = () => {
    if (!selectedSection) return
    startTransition(async () => {
      const result = await placeStudentInSection({
        applicationId,
        studentId,
        sectionId: selectedSection,
      })
      if (result.success) {
        SuccessToast(
          t?.enrollment?.placementConfirmed || "Student placed in section"
        )
        onOpenChange(false)
        onPlaced?.()
        router.refresh()
      } else {
        ErrorToast(resolveAdmissionErrorMessage(result.error, t))
      }
    })
  }

  const seatsLeft = (s: SectionOption) => s.maxCapacity - s.enrolledStudents
  const isFull = (s: SectionOption) => seatsLeft(s) <= 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {t?.enrollment?.assignSection || "Assign Section"}
          </DialogTitle>
          <DialogDescription>
            {applyingForClass
              ? `${applicantName} — ${applyingForClass}`
              : applicantName}
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
