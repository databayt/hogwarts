"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { ComplianceProvider, ConnectorMode } from "@prisma/client"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { updateComplianceConfig } from "./actions"
import { resolveComplianceError } from "./error-map"
import type { ComplianceConfigDTO } from "./queries"

type ComplianceDict = NonNullable<Dictionary["compliance"]>

interface SettingsFormProps {
  dict: ComplianceDict
  provider: ComplianceProvider
  initial: ComplianceConfigDTO | null
}

const MODES: ConnectorMode[] = [
  ConnectorMode.DRY_RUN,
  ConnectorMode.PIGGYBACK,
  ConnectorMode.OFFICIAL_API,
  ConnectorMode.RPA,
  ConnectorMode.DISABLED,
]

export function SettingsForm({ dict, provider, initial }: SettingsFormProps) {
  const [enabled, setEnabled] = useState(initial?.enabled ?? false)
  const [mode, setMode] = useState<ConnectorMode>(
    initial?.mode ?? ConnectorMode.DRY_RUN
  )
  const [submissionTimeUtc, setSubmissionTimeUtc] = useState(
    initial?.submissionTimeUtc ?? "10:00"
  )
  const [sla, setSla] = useState(initial?.parentContactSlaMinutes ?? 120)
  const [notifyAdminOnFailure, setNotifyAdminOnFailure] = useState(
    initial?.notifyAdminOnFailure ?? true
  )
  const [pending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await updateComplianceConfig({
        provider,
        enabled,
        mode,
        submissionTimeUtc,
        parentContactSlaMinutes: sla,
        notifyAdminOnFailure,
        sharedGroupId: initial?.sharedGroupId ?? null,
      })
      if (result.success) {
        toast.success(dict.settings.saveSuccess)
      } else {
        toast.error(resolveComplianceError(dict, result.errorCode))
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card space-y-6 rounded-lg border p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Label htmlFor="enabled">{dict.settings.enabledLabel}</Label>
          <p className="text-muted-foreground text-sm">
            {dict.settings.enabledHelp}
          </p>
        </div>
        <Switch
          id="enabled"
          checked={enabled}
          onCheckedChange={setEnabled}
          disabled={pending}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="provider">{dict.settings.providerLabel}</Label>
          <Input
            id="provider"
            value={dict.providers[provider]}
            readOnly
            disabled
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mode">{dict.settings.modeLabel}</Label>
          <Select
            value={mode}
            onValueChange={(value) => setMode(value as ConnectorMode)}
            disabled={pending || !enabled}
          >
            <SelectTrigger id="mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODES.map((m) => (
                <SelectItem key={m} value={m}>
                  {dict.modes[m]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-sm">
            {dict.modeDescriptions[mode]}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="submissionTimeUtc">
            {dict.settings.submissionTimeLabel}
          </Label>
          <Input
            id="submissionTimeUtc"
            type="time"
            value={submissionTimeUtc}
            onChange={(event) => setSubmissionTimeUtc(event.target.value)}
            disabled={pending || !enabled}
          />
          <p className="text-muted-foreground text-sm">
            {dict.settings.submissionTimeHelp}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sla">{dict.settings.slaLabel}</Label>
          <Input
            id="sla"
            type="number"
            min={15}
            max={720}
            value={sla}
            onChange={(event) => setSla(Number(event.target.value))}
            disabled={pending || !enabled}
          />
          <p className="text-muted-foreground text-sm">
            {dict.settings.slaHelp}
          </p>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Label htmlFor="notifyAdminOnFailure" className="cursor-pointer">
            {dict.settings.notifyAdminLabel}
          </Label>
          <p className="text-muted-foreground text-sm">
            {dict.settings.notifyAdminHelp}
          </p>
        </div>
        <Switch
          id="notifyAdminOnFailure"
          checked={notifyAdminOnFailure}
          onCheckedChange={setNotifyAdminOnFailure}
          disabled={pending}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {dict.settings.saveButton}
        </Button>
      </div>
    </form>
  )
}
