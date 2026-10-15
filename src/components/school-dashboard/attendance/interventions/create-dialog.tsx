"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Small "new intervention" sheet opened from a student row. One primary
 * action; type defaults by risk band, title follows the type until edited.
 */
import { useEffect, useState, useTransition } from "react"
import type { InterventionType } from "@prisma/client"
import { toast } from "sonner"

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
import { createIntervention } from "@/components/school-dashboard/attendance/actions"

import type { AtRiskBand } from "../early-warning/risk"
import { useRiskDict, type RiskDict } from "../early-warning/use-risk-dict"

/** Enum value → key in school.attendance.interventions.interventionTypes. */
export const INTERVENTION_TYPE_KEYS: Record<InterventionType, string> = {
  PARENT_PHONE_CALL: "parentPhoneCall",
  PARENT_EMAIL: "parentEmail",
  PARENT_MEETING: "parentMeeting",
  HOME_VISIT: "homeVisit",
  COUNSELOR_REFERRAL: "counselorReferral",
  SOCIAL_WORKER_REFERRAL: "socialWorkerReferral",
  ADMINISTRATOR_MEETING: "administratorMeeting",
  ATTENDANCE_CONTRACT: "attendanceContract",
  TRUANCY_REFERRAL: "truancyReferral",
  COMMUNITY_RESOURCE: "communityResource",
  ACADEMIC_SUPPORT: "academicSupport",
  MENTORSHIP_ASSIGNMENT: "mentorshipAssignment",
  INCENTIVE_PROGRAM: "incentiveProgram",
  OTHER: "other",
}

const DEFAULT_TYPE: Record<AtRiskBand, InterventionType> = {
  critical: "PARENT_MEETING",
  high: "PARENT_PHONE_CALL",
  moderate: "PARENT_PHONE_CALL",
}
const PRIORITY: Record<AtRiskBand, number> = {
  critical: 4,
  high: 3,
  moderate: 2,
}

const today = () => new Date().toISOString().slice(0, 10)

export function CreateInterventionDialog({
  student,
  onOpenChange,
  onCreated,
}: {
  student: { id: string; name: string; band: AtRiskBand } | null
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
}) {
  const { t: dict, typeLabels } = useRiskDict()
  const t: NonNullable<RiskDict["create"]> = dict.create ?? {}
  const label = (ty: InterventionType) =>
    typeLabels[INTERVENTION_TYPE_KEYS[ty]] ?? ty

  const [type, setType] = useState<InterventionType>("PARENT_PHONE_CALL")
  const [title, setTitle] = useState("")
  const [titleEdited, setTitleEdited] = useState(false)
  const [date, setDate] = useState(today())
  const [note, setNote] = useState("")
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!student) return
    const ty = DEFAULT_TYPE[student.band]
    setType(ty)
    setTitle(label(ty))
    setTitleEdited(false)
    setDate(today())
    setNote("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id])

  const submit = () => {
    if (!student) return
    startTransition(async () => {
      const res = await createIntervention({
        studentId: student.id,
        type,
        title: title.trim() || label(type),
        description: note.trim(),
        priority: PRIORITY[student.band],
        scheduledDate: date || undefined,
      })
      if (res.success) {
        toast.success(t.done)
        onCreated?.()
      } else {
        toast.error(t.failed)
      }
    })
  }

  return (
    <Dialog open={!!student} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>
            <bdi>
              {(t.for ?? "{name}").replace("{name}", student?.name ?? "")}
            </bdi>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t.type}</Label>
            <Select
              value={type}
              onValueChange={(v) => {
                const ty = v as InterventionType
                setType(ty)
                if (!titleEdited) setTitle(label(ty))
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.keys(INTERVENTION_TYPE_KEYS) as InterventionType[]
                ).map((ty) => (
                  <SelectItem key={ty} value={ty}>
                    {label(ty)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="iv-title">{t.name}</Label>
              <Input
                id="iv-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  setTitleEdited(true)
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="iv-date">{t.date}</Label>
              <Input
                id="iv-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="tabular-nums"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="iv-note">{t.note}</Label>
            <Textarea
              id="iv-note"
              rows={3}
              value={note}
              placeholder={t.notePlaceholder}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            className="rounded-full"
            onClick={() => onOpenChange(false)}
          >
            {t.cancel}
          </Button>
          <Button
            className="rounded-full"
            disabled={isPending}
            onClick={submit}
          >
            {isPending ? t.creating : t.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
