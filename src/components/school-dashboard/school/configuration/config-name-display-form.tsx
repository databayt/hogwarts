"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useRef, useState, useTransition } from "react"

import { displayName, type NameDisplay } from "@/lib/name-utils"
import { resolveActionError } from "@/lib/resolve-action-error"
import { ErrorToast } from "@/components/atom/toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { useDictionaryFallback } from "@/components/internationalization/use-dictionary"

import { updateSchoolNameDisplay } from "./actions"
import { SaveStatus } from "./ui/save-status"
import { Segmented } from "./ui/segmented"
import { SettingsGroup, SettingsRow } from "./ui/settings-group"

interface Props {
  schoolId: string
  initialNameDisplay: NameDisplay
  dictionary?: Dictionary
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
  dictionary: dictionaryProp,
  lang,
}: Props) {
  const dictionary = useDictionaryFallback(dictionaryProp)
  const t: Partial<Dictionary["schoolSettings"]["nameDisplay"]> =
    dictionary?.schoolSettings?.nameDisplay ?? {}
  const [value, setValue] = useState<NameDisplay>(initialNameDisplay)
  const savedRef = useRef<NameDisplay>(initialNameDisplay)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  const sample = lang === "ar" ? SAMPLE.ar : SAMPLE.en

  function handleChange(choice: NameDisplay) {
    if (choice === value) return
    setValue(choice)
    startTransition(async () => {
      const result = await updateSchoolNameDisplay(schoolId, {
        nameDisplay: choice,
      })
      if (result.success) {
        savedRef.current = choice
        setSavedAt(Date.now())
      } else {
        setValue(savedRef.current)
        ErrorToast(
          result.error
            ? resolveActionError(result.error, dictionary)
            : (t.updateError ?? "Couldn't save. Try again.")
        )
      }
    })
  }

  return (
    <div className="space-y-2">
      <SettingsGroup footer={t.footer}>
        <SettingsRow label={t.label ?? "Show names as"} stack>
          <Segmented<NameDisplay>
            value={value}
            onValueChange={handleChange}
            aria-label={t.label ?? "Show names as"}
            options={[
              {
                value: "first-second",
                label: t.firstSecond ?? "First + second",
              },
              { value: "first-last", label: t.firstLast ?? "First + last" },
            ]}
          />
        </SettingsRow>
        <SettingsRow
          label={
            <bdi className="text-lg font-medium">
              {displayName(sample, value)}
            </bdi>
          }
          description={
            <>
              {t.fullName ?? "Full name"}:{" "}
              <bdi>{displayName(sample, "full")}</bdi>
            </>
          }
        >
          <span className="text-muted-foreground text-xs">
            {t.preview ?? "Preview"}
          </span>
        </SettingsRow>
      </SettingsGroup>
      <SaveStatus pending={isPending} savedAt={savedAt} className="px-4" />
    </div>
  )
}
