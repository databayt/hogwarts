"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { Bell, Clock, Save, Settings } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"

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
}

export function AttendanceSettingsForm({
  initial,
  dictionary,
  methodLabels,
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

  const minutes = (n: number) => `${n}${t.minutesShort ?? "m"}`

  function toggleMethod(method: PickableMethod, enabled: boolean) {
    setMethods((prev) => {
      const next = enabled
        ? [...new Set([...prev, method])]
        : prev.filter((m) => m !== method)
      return next
    })
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
        toast.success(t.saved ?? "Attendance settings saved")
      } else {
        toast.error(t.saveFailed ?? "Failed to save settings")
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-muted rounded-lg p-3">
            <Settings className="text-muted-foreground h-6 w-6" />
          </div>
          <div>
            <h2>{t.title ?? "Attendance Settings"}</h2>
            <p className="text-muted-foreground text-sm">
              {t.description ?? "School-wide attendance configuration"}
            </p>
          </div>
        </div>
        <Button onClick={onSave} disabled={isPending || methods.length === 0}>
          <Save className="me-2 h-4 w-4" />
          {isPending ? (t.saving ?? "Saving...") : (t.save ?? "Save Changes")}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* General */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t.general ?? "General"}
            </CardTitle>
            <CardDescription>
              {t.generalDesc ?? "Thresholds and check-out behavior"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>{t.lateThreshold ?? "Late threshold (minutes)"}</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[lateThreshold]}
                  onValueChange={([v]) => setLateThreshold(v)}
                  min={5}
                  max={60}
                  step={5}
                  className="flex-1"
                />
                <span className="w-12 font-mono text-sm" dir="ltr">
                  {minutes(lateThreshold)}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                {t.lateThresholdHint ??
                  "Students arriving after this time are marked late"}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t.absentThreshold ?? "Absent threshold (minutes)"}</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[absentThreshold]}
                  onValueChange={([v]) => setAbsentThreshold(v)}
                  min={15}
                  max={120}
                  step={15}
                  className="flex-1"
                />
                <span className="w-12 font-mono text-sm" dir="ltr">
                  {minutes(absentThreshold)}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                {t.absentThresholdHint ??
                  "Students arriving after this time are marked absent"}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t.gracePeriod ?? "Grace period (minutes)"}</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[graceperiod]}
                  onValueChange={([v]) => setGraceperiod(v)}
                  min={0}
                  max={60}
                  step={5}
                  className="flex-1"
                />
                <span className="w-12 font-mono text-sm" dir="ltr">
                  {minutes(graceperiod)}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                {t.gracePeriodHint ??
                  "Minutes after class start before lateness counts"}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>{t.requireCheckOut ?? "Require check-out"}</Label>
                <p className="text-muted-foreground text-xs">
                  {t.requireCheckOutHint ??
                    "Students must check out when leaving"}
                </p>
              </div>
              <Switch
                checked={requireCheckOut}
                onCheckedChange={setRequireCheckOut}
              />
            </div>
          </CardContent>
        </Card>

        {/* Methods */}
        <Card>
          <CardHeader>
            <CardTitle>{t.methods ?? "Method availability"}</CardTitle>
            <CardDescription>
              {t.methodsDesc ?? "Which marking methods this school allows"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {PICKABLE_METHODS.map((method) => (
              <div key={method} className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {methodLabels?.[method] ?? method}
                </span>
                <Switch
                  checked={methods.includes(method)}
                  onCheckedChange={(enabled) => toggleMethod(method, enabled)}
                />
              </div>
            ))}
            <p className="text-muted-foreground text-xs">
              {t.methodsVirtualNote ??
                "Live-class attendance is recorded automatically and is not affected by this list."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t.alerts ?? "Absence alerts"}
          </CardTitle>
          <CardDescription>
            {t.alertsDesc ?? "Policy engine thresholds"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>{t.maxDailyAbsences ?? "Absence alert threshold"}</Label>
              <p className="text-muted-foreground text-xs">
                {t.maxDailyAbsencesHint ??
                  "Create an alert when a student's absences this term reach this count"}
              </p>
            </div>
            <Switch
              checked={alertsEnabled}
              onCheckedChange={setAlertsEnabled}
            />
          </div>
          {alertsEnabled ? (
            <div className="flex items-center gap-4">
              <Slider
                value={[maxDailyAbsences]}
                onValueChange={([v]) => setMaxDailyAbsences(v)}
                min={1}
                max={30}
                step={1}
                className="flex-1"
              />
              <span className="w-12 font-mono text-sm" dir="ltr">
                {maxDailyAbsences}
              </span>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              {t.alertsDisabled ?? "Alerts disabled"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
