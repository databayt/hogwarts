"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useRef, useState, useTransition } from "react"
import Link from "next/link"

import { resolveActionError } from "@/lib/resolve-action-error"
import { ErrorToast } from "@/components/atom/toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { useDictionaryFallback } from "@/components/internationalization/use-dictionary"
import { updateDeliveryMode } from "@/components/school-dashboard/live/actions/settings"
import type { SchoolDeliveryMode } from "@/components/school-dashboard/live/validation"

import { SaveStatus } from "./ui/save-status"
import { Segmented } from "./ui/segmented"
import { SettingsGroup, SettingsRow } from "./ui/settings-group"

interface Props {
  initialMode: SchoolDeliveryMode
  dictionary?: Dictionary
  lang: string
}

/**
 * How the school runs its classes: in person, live, or both. Writes
 * `School.conferenceDeliveryMode` — the same column the live-classes panel's
 * first control writes, through an action that derives the rest of the
 * online policy from it. The detailed knobs (per-grade, per-section, the
 * temporary window, room tools) stay on the live-classes section.
 */
export function ConfigTeachingModeForm({
  initialMode,
  dictionary: dictionaryProp,
  lang,
}: Props) {
  const dictionary = useDictionaryFallback(dictionaryProp)
  const t: Partial<Dictionary["schoolSettings"]["teachingMode"]> =
    dictionary?.schoolSettings?.teachingMode ?? {}
  const [value, setValue] = useState<SchoolDeliveryMode>(initialMode)
  const savedRef = useRef<SchoolDeliveryMode>(initialMode)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleChange(choice: SchoolDeliveryMode) {
    if (choice === value) return
    setValue(choice)
    startTransition(async () => {
      const result = await updateDeliveryMode({ mode: choice })
      if (result.success) {
        savedRef.current = choice
        setSavedAt(Date.now())
      } else {
        setValue(savedRef.current)
        ErrorToast(
          "error" in result && result.error
            ? resolveActionError(result.error, dictionary)
            : (t.updateError ?? "Couldn't save. Try again.")
        )
      }
    })
  }

  const hint: Record<SchoolDeliveryMode, string | undefined> = {
    physical: t.physicalHint,
    online: t.onlineHint,
    hybrid: t.hybridHint,
  }

  return (
    <div className="space-y-2">
      <SettingsGroup footer={t.footer}>
        <SettingsRow label={t.label ?? "Classes run"} stack>
          <Segmented<SchoolDeliveryMode>
            value={value}
            onValueChange={handleChange}
            aria-label={t.label ?? "Classes run"}
            options={[
              { value: "physical", label: t.physical ?? "In person" },
              { value: "online", label: t.online ?? "Live" },
              { value: "hybrid", label: t.hybrid ?? "Both" },
            ]}
          />
        </SettingsRow>
        <SettingsRow
          label={<p className="text-muted-foreground">{hint[value]}</p>}
        >
          {value !== "physical" && (
            <Link
              href={`/${lang}/school/configuration/live-classes`}
              className="text-primary shrink-0 text-sm hover:underline"
            >
              {t.moreSettings ?? "Live-class settings"}
            </Link>
          )}
        </SettingsRow>
      </SettingsGroup>
      <SaveStatus pending={isPending} savedAt={savedAt} className="px-4" />
    </div>
  )
}
