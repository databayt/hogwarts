"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"

import type { NameContact, NameContactListing } from "@/lib/name-utils"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { updateSchoolNameContact } from "./actions"

type NameContactDict = NonNullable<
  Dictionary["school"]["configuration"]
>["nameContact"]

interface Props {
  schoolId: string
  initial: Record<NameContactListing, NameContact>
  dictionary: Dictionary
}

export function ConfigNameContactForm({
  schoolId,
  initial,
  dictionary,
}: Props) {
  const t = dictionary?.school?.configuration?.nameContact

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium">
          {t?.title ?? "Contact Under Name"}
        </h3>
        <p className="text-muted-foreground text-sm">
          {t?.description ??
            "Choose what the teachers and students listings show under each name"}
        </p>
      </div>
      <ListingChoice
        schoolId={schoolId}
        listing="teacher"
        heading={t?.teachersHeading ?? "Teachers"}
        initialValue={initial.teacher}
        t={t}
      />
      <ListingChoice
        schoolId={schoolId}
        listing="student"
        heading={t?.studentsHeading ?? "Students"}
        initialValue={initial.student}
        t={t}
      />
    </div>
  )
}

function ListingChoice({
  schoolId,
  listing,
  heading,
  initialValue,
  t,
}: {
  schoolId: string
  listing: NameContactListing
  heading: string
  initialValue: NameContact
  t: NameContactDict | undefined
}) {
  const [value, setValue] = useState<NameContact>(initialValue)
  const [saved, setSaved] = useState<NameContact>(initialValue)
  const [isPending, startTransition] = useTransition()

  function handleChange(next: string) {
    const nameContact = next as NameContact
    setValue(nameContact)
    startTransition(async () => {
      const result = await updateSchoolNameContact(schoolId, {
        listing,
        nameContact,
      })
      if (result.success) {
        setSaved(nameContact)
        SuccessToast(t?.updateSuccess ?? "Contact line updated")
      } else {
        ErrorToast(result.error || t?.updateError || "Failed to update")
        setValue(saved)
      }
    })
  }

  const options: Array<{
    value: NameContact
    label: string
    description: string
    sample: string
  }> = [
    {
      value: "email",
      label: t?.emailLabel ?? "Email",
      description:
        t?.emailDescription ?? "Show the email address under the name",
      sample: "name@school.com",
    },
    {
      value: "phone",
      label: t?.phoneLabel ?? "Phone",
      description:
        t?.phoneDescription ?? "Show the phone number under the name",
      sample: "+249 912 345 678",
    },
  ]

  return (
    <section className="space-y-3">
      <h4 className="font-medium">{heading}</h4>
      <RadioGroup
        value={value}
        onValueChange={handleChange}
        disabled={isPending}
        className="grid gap-4 sm:grid-cols-2"
      >
        {options.map((option) => {
          const id = `${listing}-${option.value}`
          return (
            <label
              key={option.value}
              htmlFor={id}
              className="border-border hover:border-primary/50 has-[[data-state=checked]]:border-primary flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors"
            >
              <RadioGroupItem value={option.value} id={id} className="mt-0.5" />
              <div className="flex-1 space-y-1">
                <Label htmlFor={id} className="cursor-pointer font-medium">
                  {option.label}
                </Label>
                <p className="text-muted-foreground text-sm">
                  {option.description}
                </p>
                <div className="bg-muted mt-2 flex flex-col rounded-md p-3">
                  <span className="text-sm font-medium">
                    {t?.sampleName ?? "Full Name"}
                  </span>
                  <bdi
                    dir="ltr"
                    className="text-muted-foreground text-xs tabular-nums"
                  >
                    {option.sample}
                  </bdi>
                </div>
              </div>
            </label>
          )
        })}
      </RadioGroup>
    </section>
  )
}
