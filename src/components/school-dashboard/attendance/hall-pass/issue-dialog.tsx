"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Issue a hall pass: section → student → where → how long. The page never
 * passed a student list, so the old dialog's student picker was always
 * empty; it now loads the caller's sections and each section's roster.
 */
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
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { Segmented } from "@/components/school-dashboard/school/configuration/ui/segmented"

import { getAttendanceList, getSectionsForSelection } from "../actions"
import { localCalendarDay } from "../core/local-date"
import { createHallPass } from "./actions"
import { destinationIcon, destinationLabel } from "./labels"
import { hallPassDestinations, type HallPassDestination } from "./validation"

interface IssuePassDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  locale: string
  onSuccess: () => void
}

const DURATIONS = ["3", "5", "10", "15"] as const

export function IssuePassDialog({
  open,
  onOpenChange,
  locale,
  onSuccess,
}: IssuePassDialogProps) {
  const { dictionary } = useDictionary()
  const t = (dictionary?.attendanceTake?.hallPass ?? {}) as Record<
    string,
    string
  >
  const labels = dictionary?.attendanceTake?.hallPass?.destinations as
    | Record<string, string>
    | undefined
  const num = new Intl.NumberFormat(
    locale === "ar" ? "ar-SA-u-nu-latn" : "en-US"
  )

  const [sections, setSections] = useState<Array<{ id: string; name: string }>>(
    []
  )
  const [sectionId, setSectionId] = useState("")
  const [students, setStudents] = useState<
    Array<{ studentId: string; name: string }>
  >([])
  const [studentId, setStudentId] = useState("")
  const [destination, setDestination] = useState<HallPassDestination | "">("")
  const [destinationNote, setDestinationNote] = useState("")
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>("5")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open || sections.length) return
    void getSectionsForSelection().then((res) => {
      if (res.success && res.data) setSections(res.data.sections)
    })
  }, [open, sections.length])

  useEffect(() => {
    if (!sectionId) return
    void getAttendanceList({
      sectionId,
      date: localCalendarDay(),
      lang: locale,
    }).then((res) => {
      if (res.success && res.data) setStudents(res.data.rows)
    })
  }, [sectionId, locale])

  const reset = () => {
    setStudentId("")
    setDestination("")
    setDestinationNote("")
    setDuration("5")
    setNotes("")
    setError("")
  }

  const handleSubmit = async () => {
    if (!studentId || !destination) {
      setError(t.required ?? "Choose a student and a destination.")
      return
    }
    setIsSubmitting(true)
    setError("")
    try {
      const result = await createHallPass({
        studentId,
        destination,
        destinationNote: destination === "OTHER" ? destinationNote : undefined,
        expectedDuration: Number(duration),
        notes: notes || undefined,
      })
      if (result.success) {
        reset()
        onOpenChange(false)
        onSuccess()
      } else {
        setError(t.failed ?? "Couldn't issue the pass. Try again.")
      }
    } catch {
      setError(t.failed ?? "Couldn't issue the pass. Try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.issue ?? "Issue a pass"}</DialogTitle>
          <DialogDescription>
            {t.issueDesc ?? "Who is leaving, where to, and for how long."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t.section ?? "Section"}</Label>
              <Select
                value={sectionId}
                onValueChange={(v) => {
                  setSectionId(v)
                  setStudentId("")
                  setStudents([])
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t.pickSection ?? "Choose"} />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.student ?? "Student"}</Label>
              <Select
                value={studentId}
                onValueChange={setStudentId}
                disabled={!sectionId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t.pickStudent ?? "Choose"} />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.studentId} value={s.studentId}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t.destination ?? "Destination"}</Label>
            <div className="grid grid-cols-4 gap-2">
              {hallPassDestinations.map((dest) => {
                const Icon = destinationIcon[dest]
                const active = destination === dest
                return (
                  <button
                    key={dest}
                    type="button"
                    onClick={() => setDestination(dest)}
                    aria-pressed={active}
                    className={
                      "flex flex-col items-center gap-1 rounded-xl border p-2 text-xs transition-colors " +
                      (active
                        ? "border-primary bg-primary/5 text-foreground"
                        : "text-muted-foreground hover:text-foreground")
                    }
                  >
                    <Icon className="size-4" />
                    <span className="truncate">
                      {destinationLabel(dest, labels)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {destination === "OTHER" ? (
            <Input
              value={destinationNote}
              onChange={(e) => setDestinationNote(e.target.value)}
              placeholder={t.where ?? "Where to?"}
              aria-label={t.where ?? "Where to?"}
            />
          ) : null}

          <div className="space-y-2">
            <Label>{t.duration ?? "Back within"}</Label>
            <Segmented
              value={duration}
              onValueChange={setDuration}
              options={DURATIONS.map((m) => ({
                value: m,
                label: (t.minutes ?? "{n} min").replace(
                  "{n}",
                  num.format(Number(m))
                ),
              }))}
              aria-label={t.duration ?? "Back within"}
            />
          </div>

          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t.notes ?? "Note (optional)"}
            aria-label={t.notes ?? "Note (optional)"}
            rows={2}
          />

          {error ? <p className="text-destructive text-sm">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t.cancel ?? "Cancel"}
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || !studentId || !destination}
          >
            {t.issueButton ?? "Issue pass"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
