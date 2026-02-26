// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Kiosk Reasons
 *
 * Component for selecting late arrival or early departure reasons.
 */
"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import type { KioskAction } from "./validation"
import { earlyDepartureReasonCodes, lateReasonCodes } from "./validation"

interface KioskReasonsProps {
  action: KioskAction
  isLate?: boolean
  isEarlyDeparture?: boolean
  onSubmit: (reasonCode?: string, reasonNote?: string) => void
  onSkip: () => void
  onCancel: () => void
  locale: string
}

const lateReasonLabels: Record<string, { en: string; ar: string }> = {
  TRAFFIC: { en: "Traffic", ar: "ازدحام مروري" },
  MEDICAL: { en: "Medical Appointment", ar: "موعد طبي" },
  FAMILY: { en: "Family Emergency", ar: "طوارئ عائلية" },
  TRANSPORTATION: { en: "Transportation Issue", ar: "مشكلة في المواصلات" },
  WEATHER: { en: "Weather Conditions", ar: "ظروف جوية" },
  OTHER: { en: "Other", ar: "أخرى" },
}

const earlyDepartureLabels: Record<string, { en: string; ar: string }> = {
  MEDICAL: { en: "Medical Appointment", ar: "موعد طبي" },
  APPOINTMENT: { en: "Scheduled Appointment", ar: "موعد محدد" },
  FAMILY_EMERGENCY: { en: "Family Emergency", ar: "طوارئ عائلية" },
  PARENT_PICKUP: { en: "Parent Pickup", ar: "استلام ولي الأمر" },
  SCHOOL_ACTIVITY: { en: "School Activity", ar: "نشاط مدرسي" },
  OTHER: { en: "Other", ar: "أخرى" },
}

export function KioskReasons({
  action,
  isLate,
  isEarlyDeparture,
  onSubmit,
  onSkip,
  onCancel,
  locale,
}: KioskReasonsProps) {
  const { dictionary } = useDictionary()
  const t = dictionary?.attendance?.kiosk
  const isRTL = locale === "ar"
  const [selectedReason, setSelectedReason] = useState<string>("")
  const [customNote, setCustomNote] = useState("")

  const reasons =
    action === "CHECK_IN" && isLate
      ? lateReasonCodes
      : action === "CHECK_OUT" && isEarlyDeparture
        ? earlyDepartureReasonCodes
        : []

  const labels = action === "CHECK_IN" ? lateReasonLabels : earlyDepartureLabels

  const title =
    action === "CHECK_IN"
      ? t?.late_arrival_reason || "Reason for Late Arrival"
      : t?.early_departure_reason || "Reason for Early Departure"

  return (
    <div className="flex w-full max-w-lg flex-col items-center text-center">
      <h2 className="mb-6 text-2xl font-bold">{title}</h2>

      <div className="mb-6 grid w-full grid-cols-2 gap-3">
        {reasons.map((reason) => (
          <button
            key={reason}
            onClick={() => setSelectedReason(reason)}
            className={cn(
              "rounded-xl p-4 text-start transition-colors",
              selectedReason === reason
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {labels[reason]?.[isRTL ? "ar" : "en"] || reason}
          </button>
        ))}
      </div>

      {selectedReason === "OTHER" && (
        <div className="mb-6 w-full">
          <textarea
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder={t?.enter_reason || "Enter reason here..."}
            className="border-input bg-background w-full rounded-lg border p-3 text-lg"
            rows={3}
          />
        </div>
      )}

      <div className="flex w-full gap-4">
        <button
          onClick={onCancel}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/80 flex-1 rounded-xl py-4 text-lg font-medium transition-colors"
        >
          {t?.cancel || "Cancel"}
        </button>
        <button
          onClick={onSkip}
          className="text-muted-foreground hover:text-foreground flex-1 rounded-xl py-4 text-lg font-medium transition-colors"
        >
          {t?.skip || "Skip"}
        </button>
        <button
          onClick={() =>
            onSubmit(selectedReason || undefined, customNote || undefined)
          }
          disabled={!selectedReason}
          className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground flex-1 rounded-xl py-4 text-lg font-medium transition-colors"
        >
          {t?.confirm || "Confirm"}
        </button>
      </div>
    </div>
  )
}
