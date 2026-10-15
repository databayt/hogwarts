"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Attendance › Settings — the school-wide `AttendancePolicy` row, as
 * Apple-Settings inset groups: Timing, Methods, Alerts, one Save.
 * The method switches feed the mobile API (`settings/store.ts`); the footer
 * says so, because the web marking pages keep every method available.
 */
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { SuccessToast } from "@/components/atom/toast"
import {
  SettingsGroup,
  SettingsRow,
} from "@/components/school-dashboard/school/configuration/ui/settings-group"

import type { AttendanceSettings } from "../actions/policy"
import { updateAttendanceSettings } from "../actions/policy"

const PICKABLE_METHODS = [
  "MANUAL",
  "QR_CODE",
  "BARCODE",
  "GEOFENCE",
  "KIOSK",
  "BULK_UPLOAD",
  "RFID",
  "NFC",
  "BLUETOOTH",
  "FINGERPRINT",
  "FACE_RECOGNITION",
] as const

type PickableMethod = (typeof PICKABLE_METHODS)[number]

interface AttendanceSettingsFormProps {
  initial: AttendanceSettings
  dictionary?: Record<string, string>
  methodLabels?: Record<string, string>
  /** One-line note under the methods group (mobile-only effect). */
  methodsFootnote?: string
  /** Label for the absence-count slider row. */
  alertAfterLabel?: string
}

function MinutesSlider({
  value,
  onChange,
  min,
  max,
  step,
  unit,
}: {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  unit: string
}) {
  return (
    <div className="flex w-full items-center gap-4 sm:w-64">
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="flex-1"
      />
      <span className="text-muted-foreground w-12 text-end text-sm tabular-nums">
        {value}
        {unit ? ` ${unit}` : ""}
      </span>
    </div>
  )
}

export function AttendanceSettingsForm({
  initial,
  dictionary,
  methodLabels,
  methodsFootnote,
  alertAfterLabel,
}: AttendanceSettingsFormProps) {
  const t = dictionary ?? {}
  const [isPending, startTransition] = useTransition()
  const [lateThreshold, setLateThreshold] = useState(initial.lateThreshold)
  const [absentThreshold, setAbsentThreshold] = useState(
    initial.absentThreshold
  )
  const [graceperiod, setGraceperiod] = useState(initial.graceperiod)
  const [requireCheckOut, setRequireCheckOut] = useState(
    initial.requireCheckOut
  )
  const [methods, setMethods] = useState<PickableMethod[]>(
    initial.methods as PickableMethod[]
  )
  const [alertsEnabled, setAlertsEnabled] = useState(
    initial.maxDailyAbsences != null
  )
  const [maxDailyAbsences, setMaxDailyAbsences] = useState(
    initial.maxDailyAbsences ?? 5
  )

  const unit = t.minutesShort ?? "min"

  function toggleMethod(method: PickableMethod, enabled: boolean) {
    setMethods((prev) =>
      enabled
        ? [...new Set([...prev, method])]
        : prev.filter((m) => m !== method)
    )
  }

  function onSave() {
    startTransition(async () => {
      const result = await updateAttendanceSettings({
        lateThreshold,
        absentThreshold,
        graceperiod,
        requireCheckOut,
        methods,
        maxDailyAbsences: alertsEnabled ? maxDailyAbsences : null,
      })
      if (result.success) {
        SuccessToast(t.saved ?? "Attendance settings saved")
      } else {
        toast.error(t.saveFailed ?? "Failed to save settings")
      }
    })
  }

  const methodName = (m: string) =>
    methodLabels?.[m] ?? m.replace(/_/g, " ").toLowerCase()

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <SettingsGroup
        title={t.general ?? "General"}
        footer={t.generalDesc ?? "Thresholds and check-out behavior"}
      >
        <SettingsRow
          label={t.lateThreshold ?? "Late threshold (minutes)"}
          description={t.lateThresholdHint}
          stack
        >
          <MinutesSlider
            value={lateThreshold}
            onChange={setLateThreshold}
            min={5}
            max={60}
            step={5}
            unit={unit}
          />
        </SettingsRow>
        <SettingsRow
          label={t.absentThreshold ?? "Absent threshold (minutes)"}
          description={t.absentThresholdHint}
          stack
        >
          <MinutesSlider
            value={absentThreshold}
            onChange={setAbsentThreshold}
            min={15}
            max={120}
            step={15}
            unit={unit}
          />
        </SettingsRow>
        <SettingsRow
          label={t.gracePeriod ?? "Grace period (minutes)"}
          description={t.gracePeriodHint}
          stack
        >
          <MinutesSlider
            value={graceperiod}
            onChange={setGraceperiod}
            min={0}
            max={60}
            step={5}
            unit={unit}
          />
        </SettingsRow>
        <SettingsRow
          label={t.requireCheckOut ?? "Require check-out"}
          description={t.requireCheckOutHint}
        >
          <Switch
            checked={requireCheckOut}
            onCheckedChange={setRequireCheckOut}
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup
        title={t.methods ?? "Method availability"}
        footer={
          <>
            {methodsFootnote ? <span>{methodsFootnote} </span> : null}
            {t.methodsVirtualNote ??
              "Live-class attendance is recorded automatically and is not affected by this list."}
          </>
        }
      >
        {PICKABLE_METHODS.map((method) => (
          <SettingsRow key={method} label={methodName(method)}>
            <Switch
              checked={methods.includes(method)}
              onCheckedChange={(enabled) => toggleMethod(method, enabled)}
              aria-label={methodName(method)}
            />
          </SettingsRow>
        ))}
      </SettingsGroup>

      <SettingsGroup title={t.alerts ?? "Absence alerts"} footer={t.alertsDesc}>
        <SettingsRow
          label={t.maxDailyAbsences ?? "Absence alert threshold"}
          description={t.maxDailyAbsencesHint}
        >
          <Switch checked={alertsEnabled} onCheckedChange={setAlertsEnabled} />
        </SettingsRow>
        {alertsEnabled ? (
          <SettingsRow
            label={alertAfterLabel ?? "Absences before an alert"}
            stack
          >
            <MinutesSlider
              value={maxDailyAbsences}
              onChange={setMaxDailyAbsences}
              min={1}
              max={30}
              step={1}
              unit=""
            />
          </SettingsRow>
        ) : null}
      </SettingsGroup>

      <div className="flex justify-end">
        <Button
          onClick={onSave}
          disabled={isPending || methods.length === 0}
          className="rounded-full px-6"
        >
          {isPending ? (t.saving ?? "Saving...") : (t.save ?? "Save Changes")}
        </Button>
      </div>
    </div>
  )
}
