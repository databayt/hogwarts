"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"

import type { NameContact } from "@/lib/name-utils"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { updateSchoolNameContact } from "./actions"

interface Props {
  schoolId: string
  initialNameContact: NameContact
  dictionary: Dictionary
}

export function ConfigNameContactForm({
  schoolId,
  initialNameContact,
  dictionary,
}: Props) {
  const t = dictionary?.school?.configuration?.nameContact
  const [nameContact, setNameContact] =
    useState<NameContact>(initialNameContact)
  const [isPending, startTransition] = useTransition()

  function handleChange(value: string) {
    const next = value as NameContact
    setNameContact(next)
    startTransition(async () => {
      const result = await updateSchoolNameContact(schoolId, {
        nameContact: next,
      })
      if (result.success) {
        SuccessToast(t?.updateSuccess ?? "Contact line updated")
      } else {
        ErrorToast(result.error || t?.updateError || "Failed to update")
        setNameContact(initialNameContact)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">
          {t?.title ?? "Contact Under Name"}
        </h3>
        <p className="text-muted-foreground text-sm">
          {t?.description ??
            "Choose what the listings show under each person's name"}
        </p>
      </div>
      <RadioGroup
        value={nameContact}
        onValueChange={handleChange}
        disabled={isPending}
        className="space-y-4"
      >
        <label className="border-border hover:border-primary/50 has-[[data-state=checked]]:border-primary flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors">
          <RadioGroupItem value="email" id="email" className="mt-0.5" />
          <div className="flex-1 space-y-1">
            <Label htmlFor="email" className="cursor-pointer font-medium">
              {t?.emailLabel ?? "Email"}
            </Label>
            <p className="text-muted-foreground text-sm">
              {t?.emailDescription ?? "Show the email address under the name"}
            </p>
            <div className="bg-muted mt-2 flex flex-col rounded-md p-3">
              <span className="text-sm font-medium">
                {t?.sampleName ?? "Full Name"}
              </span>
              <bdi dir="ltr" className="text-muted-foreground text-xs">
                name@school.com
              </bdi>
            </div>
          </div>
        </label>
        <label className="border-border hover:border-primary/50 has-[[data-state=checked]]:border-primary flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors">
          <RadioGroupItem value="phone" id="phone" className="mt-0.5" />
          <div className="flex-1 space-y-1">
            <Label htmlFor="phone" className="cursor-pointer font-medium">
              {t?.phoneLabel ?? "Phone"}
            </Label>
            <p className="text-muted-foreground text-sm">
              {t?.phoneDescription ?? "Show the phone number under the name"}
            </p>
            <div className="bg-muted mt-2 flex flex-col rounded-md p-3">
              <span className="text-sm font-medium">
                {t?.sampleName ?? "Full Name"}
              </span>
              <bdi
                dir="ltr"
                className="text-muted-foreground text-xs tabular-nums"
              >
                +249 912 345 678
              </bdi>
            </div>
          </div>
        </label>
      </RadioGroup>
    </div>
  )
}
