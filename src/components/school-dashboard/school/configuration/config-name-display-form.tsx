"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"

import { displayName, type NameDisplay } from "@/lib/name-utils"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { updateSchoolNameDisplay } from "./actions"

interface Props {
  schoolId: string
  initialNameDisplay: NameDisplay
  dictionary: Dictionary
  lang: string
}

// The preview person: four names, so both choices visibly differ.
const SAMPLE = {
  ar: { firstName: "محمد", middleName: "أحمد علي", lastName: "حسن" },
  en: { firstName: "Mohamed", middleName: "Ahmed Ali", lastName: "Hassan" },
}

export function ConfigNameDisplayForm({
  schoolId,
  initialNameDisplay,
  dictionary,
  lang,
}: Props) {
  const t = (
    dictionary?.school?.configuration as
      | { nameDisplay?: Record<string, string> }
      | undefined
  )?.nameDisplay
  const [value, setValue] = useState<NameDisplay>(initialNameDisplay)
  const [isPending, startTransition] = useTransition()
  const sample = lang === "ar" ? SAMPLE.ar : SAMPLE.en

  function handleChange(next: string) {
    const choice = next as NameDisplay
    setValue(choice)
    startTransition(async () => {
      const result = await updateSchoolNameDisplay(schoolId, {
        nameDisplay: choice,
      })
      if (result.success) {
        SuccessToast(t?.updateSuccess ?? "Name display updated")
      } else {
        ErrorToast(result.error || t?.updateError || "Failed to update")
        setValue(initialNameDisplay)
      }
    })
  }

  const options: Array<{
    value: NameDisplay
    label: string
    description: string
  }> = [
    {
      value: "first-second",
      label: t?.firstSecondLabel ?? "First + second name",
      description:
        t?.firstSecondDescription ??
        "The person's name and their father's name",
    },
    {
      value: "first-last",
      label: t?.firstLastLabel ?? "First + last name",
      description:
        t?.firstLastDescription ?? "The person's name and the family name",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t?.title ?? "Name Display"}</h3>
        <p className="text-muted-foreground text-sm">
          {t?.description ??
            "How names appear in listings and profiles. Applications, certificates and login slips always show the full name."}
        </p>
      </div>
      <RadioGroup
        value={value}
        onValueChange={handleChange}
        disabled={isPending}
        className="space-y-4"
      >
        {options.map((o) => (
          <label
            key={o.value}
            className="border-border hover:border-primary/50 has-[[data-state=checked]]:border-primary flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors"
          >
            <RadioGroupItem value={o.value} id={o.value} className="mt-0.5" />
            <div className="flex-1 space-y-1">
              <Label htmlFor={o.value} className="cursor-pointer font-medium">
                {o.label}
              </Label>
              <p className="text-muted-foreground text-sm">{o.description}</p>
              <div className="bg-muted mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-md p-3 text-sm">
                <span className="font-medium">
                  <bdi dir="auto">{displayName(sample, o.value)}</bdi>
                </span>
                <span className="text-muted-foreground text-xs">
                  <bdi dir="auto">{displayName(sample, "full")}</bdi>
                </span>
              </div>
            </div>
          </label>
        ))}
      </RadioGroup>
    </div>
  )
}
