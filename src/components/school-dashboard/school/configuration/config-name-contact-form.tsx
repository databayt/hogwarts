"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useRef, useState, useTransition } from "react"

import type { NameContact, NameContactListing } from "@/lib/name-utils"
import { resolveActionError } from "@/lib/resolve-action-error"
import { ErrorToast } from "@/components/atom/toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { updateSchoolNameContact } from "./actions"
import { SaveStatus } from "./ui/save-status"
import { Segmented } from "./ui/segmented"
import { SettingsGroup, SettingsRow } from "./ui/settings-group"

interface Props {
  schoolId: string
  initial: Record<NameContactListing, NameContact>
  dictionary: Dictionary
}

const LISTINGS: Array<{
  key: NameContactListing
  label: "teachers" | "students" | "parents" | "staff"
}> = [
  { key: "teacher", label: "teachers" },
  { key: "student", label: "students" },
  { key: "guardian", label: "parents" },
  { key: "staff", label: "staff" },
]

const SAMPLE_PHONE = "+249 912 345 678"

export function ConfigNameContactForm({
  schoolId,
  initial,
  dictionary,
}: Props) {
  const t: Partial<Dictionary["schoolSettings"]["nameContact"]> =
    dictionary?.schoolSettings?.nameContact ?? {}
  const [values, setValues] = useState(initial)
  // Last server-confirmed values, for rollback when a save fails.
  const savedRef = useRef(initial)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleChange(listing: NameContactListing, nameContact: NameContact) {
    if (values[listing] === nameContact) return
    setValues((v) => ({ ...v, [listing]: nameContact }))
    startTransition(async () => {
      const result = await updateSchoolNameContact(schoolId, {
        listing,
        nameContact,
      })
      if (result.success) {
        savedRef.current = { ...savedRef.current, [listing]: nameContact }
        setSavedAt(Date.now())
      } else {
        setValues((v) => ({ ...v, [listing]: savedRef.current[listing] }))
        ErrorToast(
          result.error
            ? resolveActionError(result.error, dictionary)
            : (t.updateError ?? "Couldn't save. Try again.")
        )
      }
    })
  }

  // Footer: the sentence with one LTR sample spliced in at {sample}.
  const footerTpl =
    t.footer ??
    "The contact detail shown under each person in these lists, for example {sample}."
  const [before, after = ""] = footerTpl.split("{sample}")

  const options: Array<{ value: NameContact; label: string }> = [
    { value: "email", label: t.email ?? "Email" },
    { value: "phone", label: t.phone ?? "Phone" },
  ]

  return (
    <div className="space-y-2">
      <SettingsGroup
        title={t.title ?? "Under each name"}
        footer={
          <>
            {before}
            <bdi dir="ltr" className="tabular-nums">
              {SAMPLE_PHONE}
            </bdi>
            {after}
          </>
        }
      >
        {LISTINGS.map(({ key, label }) => {
          const rowLabel = t[label] ?? label
          return (
            <SettingsRow key={key} label={rowLabel}>
              <Segmented<NameContact>
                value={values[key]}
                onValueChange={(v) => handleChange(key, v)}
                aria-label={rowLabel}
                options={options}
                className="w-auto"
              />
            </SettingsRow>
          )
        })}
      </SettingsGroup>
      <SaveStatus pending={isPending} savedAt={savedAt} className="px-4" />
    </div>
  )
}
