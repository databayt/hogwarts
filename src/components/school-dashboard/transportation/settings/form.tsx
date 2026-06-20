"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { updateSettings } from "../actions/settings"

export interface TransportationSettingsValues {
  defaultPickupBufferMinutes: number
  defaultMonthlyFee: number | null
  notifyGuardiansOnTripStart: boolean
  notifyGuardiansOnTripFinish: boolean
  notifyGuardiansOnTripCancel: boolean
  lateThresholdMinutes: number
  enableRouteOptimization: boolean
  approachAlertMeters: number
}

interface Props {
  dictionary: Dictionary
  initial: TransportationSettingsValues
}

export function TransportationSettingsForm({ dictionary, initial }: Props) {
  const t = dictionary.transportation.settings
  const [values, setValues] = useState<TransportationSettingsValues>(initial)
  const [pending, startTransition] = useTransition()

  function setField<K extends keyof TransportationSettingsValues>(
    key: K,
    value: TransportationSettingsValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    startTransition(async () => {
      const result = await updateSettings(values)
      if (result.success) {
        toast.success(t.savedToast)
      } else {
        toast.error(t.saveFailedToast)
      }
    })
  }

  return (
    <form className="flex max-w-2xl flex-col gap-6" onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.title}</CardTitle>
          <p className="text-muted-foreground text-sm">{t.subtitle}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pickupBuffer">{t.defaultPickupBuffer}</Label>
            <Input
              id="pickupBuffer"
              type="number"
              min={0}
              max={240}
              value={values.defaultPickupBufferMinutes}
              onChange={(e) =>
                setField(
                  "defaultPickupBufferMinutes",
                  Number(e.target.value) || 0
                )
              }
            />
            <p className="text-muted-foreground text-xs">
              {t.defaultPickupBufferHelp}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthlyFee">{t.defaultMonthlyFee}</Label>
            <Input
              id="monthlyFee"
              type="number"
              min={0}
              step="0.01"
              value={values.defaultMonthlyFee ?? ""}
              onChange={(e) =>
                setField(
                  "defaultMonthlyFee",
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
            />
            <p className="text-muted-foreground text-xs">
              {t.defaultMonthlyFeeHelp}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lateThreshold">{t.lateThreshold}</Label>
            <Input
              id="lateThreshold"
              type="number"
              min={0}
              max={240}
              value={values.lateThresholdMinutes}
              onChange={(e) =>
                setField("lateThresholdMinutes", Number(e.target.value) || 0)
              }
            />
            <p className="text-muted-foreground text-xs">
              {t.lateThresholdHelp}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {dictionary.transportation.nav.trips}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow
            id="notifyOnStart"
            label={t.notifyOnStart}
            checked={values.notifyGuardiansOnTripStart}
            onChange={(v) => setField("notifyGuardiansOnTripStart", v)}
          />
          <ToggleRow
            id="notifyOnFinish"
            label={t.notifyOnFinish}
            checked={values.notifyGuardiansOnTripFinish}
            onChange={(v) => setField("notifyGuardiansOnTripFinish", v)}
          />
          <ToggleRow
            id="notifyOnCancel"
            label={t.notifyOnCancel}
            checked={values.notifyGuardiansOnTripCancel}
            onChange={(v) => setField("notifyGuardiansOnTripCancel", v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.optimizationTitle}</CardTitle>
          <p className="text-muted-foreground text-sm">
            {t.optimizationSubtitle}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow
            id="enableRouteOptimization"
            label={t.enableRouteOptimization}
            checked={values.enableRouteOptimization}
            onChange={(v) => setField("enableRouteOptimization", v)}
          />
          <p className="text-muted-foreground text-xs">
            {t.enableRouteOptimizationHelp}
          </p>
          <div className="space-y-2">
            <Label htmlFor="approachAlertMeters">{t.approachAlertMeters}</Label>
            <Input
              id="approachAlertMeters"
              type="number"
              min={0}
              max={20000}
              value={values.approachAlertMeters}
              onChange={(e) =>
                setField("approachAlertMeters", Number(e.target.value) || 0)
              }
            />
            <p className="text-muted-foreground text-xs">
              {t.approachAlertMetersHelp}
            </p>
          </div>
        </CardContent>
      </Card>

      <div>
        <Button type="submit" disabled={pending}>
          {t.saveButton}
        </Button>
      </div>
    </form>
  )
}

function ToggleRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={id} className="cursor-pointer">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
