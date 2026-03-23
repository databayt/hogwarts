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
  const t = (dictionary?.school?.attendance as any)?.kioskReasons as
    | Record<string, any>
    | undefined
  const reasonsDict = t?.reasons as Record<string, string> | undefined
  const [selectedReason, setSelectedReason] = useState<string>("")
  const [customNote, setCustomNote] = useState("")

  const reasons =
    action === "CHECK_IN" && isLate
      ? lateReasonCodes
      : action === "CHECK_OUT" && isEarlyDeparture
        ? earlyDepartureReasonCodes
        : []

  // Map reason codes to dictionary keys
  const getReasonLabel = (reason: string): string => {
    const keyMap: Record<string, string> = {
      TRAFFIC: "traffic",
      MEDICAL: "medical",
      FAMILY: "family",
      FAMILY_EMERGENCY: "family",
      TRANSPORTATION: "transport",
      WEATHER: "weather",
      PARENT_PICKUP: "earlyPickup",
      APPOINTMENT: "appointment",
      SCHOOL_ACTIVITY: "other",
      OTHER: "other",
    }
    const dictKey = keyMap[reason]
    if (dictKey && reasonsDict?.[dictKey]) return reasonsDict[dictKey]
    return reason.charAt(0) + reason.slice(1).toLowerCase().replace(/_/g, " ")
  }

  const title =
    action === "CHECK_IN"
      ? t?.lateArrival || "Reason for Late Arrival"
      : t?.earlyDeparture || "Reason for Early Departure"

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
            {getReasonLabel(reason)}
          </button>
        ))}
      </div>

      {selectedReason === "OTHER" && (
        <div className="mb-6 w-full">
          <textarea
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder={
              (dictionary?.school?.attendance as any)?.kiosk?.enter_reason ||
              "Enter reason here..."
            }
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
