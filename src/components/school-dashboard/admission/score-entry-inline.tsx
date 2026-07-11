"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Pencil, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { updateApplicationScores } from "./actions"

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

interface ScoreEntryInlineProps {
  applicationId: string
  entranceScore: number | null
  interviewScore: number | null
  dictionary: Dictionary["school"]["admission"]
}

export function ScoreEntryInline({
  applicationId,
  entranceScore,
  interviewScore,
  dictionary,
}: ScoreEntryInlineProps) {
  const t = dictionary
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [entrance, setEntrance] = useState(
    entranceScore != null ? String(entranceScore) : ""
  )
  const [interview, setInterview] = useState(
    interviewScore != null ? String(interviewScore) : ""
  )

  const handleSave = () => {
    startTransition(async () => {
      const entranceNum = entrance !== "" ? parseFloat(entrance) : null
      const interviewNum = interview !== "" ? parseFloat(interview) : null

      const result = await updateApplicationScores({
        id: applicationId,
        entranceScore: entranceNum,
        interviewScore: interviewNum,
      })
      if (result.success) {
        SuccessToast(t?.meritList?.scoresUpdated || "Scores updated")
        setEditing(false)
        router.refresh()
      } else {
        ErrorToast(resolveAdmissionErrorMessage(result.error, t))
      }
    })
  }

  const handleCancel = () => {
    setEntrance(entranceScore != null ? String(entranceScore) : "")
    setInterview(interviewScore != null ? String(interviewScore) : "")
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-4 rounded-lg border p-3">
        <div className="flex flex-1 gap-6">
          <div>
            <p className="text-muted-foreground text-xs">
              {t?.applicationDetail?.entranceScore || "Entrance Score"}
            </p>
            <p className="text-sm font-medium tabular-nums">
              {entranceScore != null ? entranceScore.toFixed(1) : "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">
              {t?.applicationDetail?.interviewScore || "Interview Score"}
            </p>
            <p className="text-sm font-medium tabular-nums">
              {interviewScore != null ? interviewScore.toFixed(1) : "—"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditing(true)}
          className="h-8 gap-1.5"
        >
          <Pencil className="h-3.5 w-3.5" />
          {t?.meritList?.editScores || "Edit"}
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="detail-entrance-score">
            {t?.applicationDetail?.entranceScore || "Entrance Score"}
          </Label>
          <Input
            id="detail-entrance-score"
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={entrance}
            onChange={(e) => setEntrance(e.target.value)}
            placeholder="0–100"
            disabled={isPending}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="detail-interview-score">
            {t?.applicationDetail?.interviewScore || "Interview Score"}
          </Label>
          <Input
            id="detail-interview-score"
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={interview}
            onChange={(e) => setInterview(e.target.value)}
            placeholder="0–100"
            disabled={isPending}
          />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          <Check className="me-1.5 h-3.5 w-3.5" />
          {isPending
            ? t?.toolbar?.saving || "Saving…"
            : t?.toolbar?.save || "Save"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={isPending}
        >
          <X className="me-1.5 h-3.5 w-3.5" />
          {t?.toolbar?.cancel || "Cancel"}
        </Button>
      </div>
    </div>
  )
}
