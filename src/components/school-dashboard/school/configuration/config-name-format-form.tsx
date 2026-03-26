"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"

import type { NameFormat } from "@/lib/name-utils"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"

import { updateSchoolNameFormat } from "./actions"

interface Props {
  schoolId: string
  initialNameFormat: NameFormat
}

export function ConfigNameFormatForm({ schoolId, initialNameFormat }: Props) {
  const [nameFormat, setNameFormat] = useState<NameFormat>(initialNameFormat)
  const [isPending, startTransition] = useTransition()

  function handleChange(value: string) {
    const newFormat = value as NameFormat
    setNameFormat(newFormat)
    startTransition(async () => {
      const result = await updateSchoolNameFormat(schoolId, {
        nameFormat: newFormat,
      })
      if (result.success) {
        SuccessToast("Name format updated")
      } else {
        ErrorToast(result.error || "Failed to update")
        setNameFormat(initialNameFormat)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Name Format</h3>
        <p className="text-muted-foreground text-sm">
          Choose how names are entered across forms
        </p>
      </div>
      <RadioGroup
        value={nameFormat}
        onValueChange={handleChange}
        disabled={isPending}
        className="space-y-4"
      >
        <label className="border-border hover:border-primary/50 has-[[data-state=checked]]:border-primary flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors">
          <RadioGroupItem value="split" id="split" className="mt-0.5" />
          <div className="flex-1 space-y-1">
            <Label htmlFor="split" className="cursor-pointer font-medium">
              Split Name
            </Label>
            <p className="text-muted-foreground text-sm">
              Two fields: First Name + Last Name
            </p>
            <div className="bg-muted mt-2 flex gap-2 rounded-md p-3">
              <div className="bg-background flex-1 rounded border px-3 py-1.5 text-sm opacity-60">
                First Name
              </div>
              <div className="bg-background flex-1 rounded border px-3 py-1.5 text-sm opacity-60">
                Last Name
              </div>
            </div>
          </div>
        </label>
        <label className="border-border hover:border-primary/50 has-[[data-state=checked]]:border-primary flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors">
          <RadioGroupItem value="full" id="full" className="mt-0.5" />
          <div className="flex-1 space-y-1">
            <Label htmlFor="full" className="cursor-pointer font-medium">
              Full Name
            </Label>
            <p className="text-muted-foreground text-sm">
              Single field for the complete name
            </p>
            <div className="bg-muted mt-2 rounded-md p-3">
              <div className="bg-background rounded border px-3 py-1.5 text-sm opacity-60">
                Full Name
              </div>
            </div>
          </div>
        </label>
      </RadioGroup>
    </div>
  )
}
