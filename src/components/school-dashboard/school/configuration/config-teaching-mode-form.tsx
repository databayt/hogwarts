"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useRef, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, MonitorPlay, School, Shuffle } from "lucide-react"

import { resolveActionError } from "@/lib/resolve-action-error"
import { cn } from "@/lib/utils"
import { ErrorToast } from "@/components/atom/toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { useDictionaryFallback } from "@/components/internationalization/use-dictionary"
import { updateDeliveryMode } from "@/components/school-dashboard/live/actions/settings"
import type { LiveTodaySummary } from "@/components/school-dashboard/live/live-today"
import type { SchoolDeliveryMode } from "@/components/school-dashboard/live/validation"

import { LiveReadiness } from "./live-readiness"
import { SaveStatus } from "./ui/save-status"

interface Props {
  initialMode: SchoolDeliveryMode
  /** Today's live-class state, read on the server. Null when it failed. */
  readiness: LiveTodaySummary | null
  dictionary?: Dictionary
  lang: string
}

const ICONS: Record<SchoolDeliveryMode, React.ReactNode> = {
  physical: <School />,
  online: <MonitorPlay />,
  hybrid: <Shuffle />,
}

/**
 * How the school runs its classes: in person, live, or both. This is the
 * front door to live classes. Three cards, each saying what happens when you
 * pick it, and under them a "Ready for today" checklist. The checklist answers
 * the question the old single control left open: will a class actually
 * open today?
 *
 * Writes `School.conferenceDeliveryMode` through `updateDeliveryMode`, which
 * derives the rest of the online policy. Detailed knobs stay on the
 * live-classes section.
 */
export function ConfigTeachingModeForm({
  initialMode,
  readiness,
  dictionary: dictionaryProp,
  lang,
}: Props) {
  const dictionary = useDictionaryFallback(dictionaryProp)
  const router = useRouter()
  const t: Partial<Dictionary["schoolSettings"]["teachingMode"]> & {
    recommended?: string
  } = dictionary?.schoolSettings?.teachingMode ?? {}
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
        // The checklist is read on the server: ask it again.
        router.refresh()
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

  const options: Array<{
    value: SchoolDeliveryMode
    label: string
    hint: string
    recommended?: boolean
  }> = [
    {
      value: "physical",
      label: t.physical ?? "In person",
      hint:
        t.physicalHint ??
        "Every class meets in the building. No live rooms and no join buttons on the timetable.",
    },
    {
      value: "online",
      label: t.online ?? "Live",
      hint:
        t.onlineHint ??
        "Every class is also taught live. Students and teachers join it by clicking the class on the timetable.",
      recommended: true,
    },
    {
      value: "hybrid",
      label: t.hybrid ?? "Both",
      hint:
        t.hybridHint ??
        "In person and live together. Choose which grades and sections go live, or open a temporary online window.",
    },
  ]

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <div
          role="radiogroup"
          aria-label={t.label ?? "Classes run"}
          className="grid gap-2"
        >
          {options.map((o) => {
            const selected = value === o.value
            return (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={isPending}
                onClick={() => handleChange(o.value)}
                className={cn(
                  "bg-card flex w-full items-start gap-3 rounded-2xl border p-4 text-start transition-colors",
                  "hover:bg-muted/50 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                  "disabled:cursor-wait",
                  selected && "border-foreground ring-foreground/10 ring-2"
                )}
              >
                <span
                  className={cn(
                    "bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5",
                    selected && "bg-foreground text-background"
                  )}
                >
                  {ICONS[o.value]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{o.label}</span>
                    {o.recommended ? (
                      <span className="rounded-full bg-[#00bc6d]/15 px-2 py-0.5 text-[11px] font-medium text-[#00804a] dark:text-[#3ddc97]">
                        {t.recommended ?? "Recommended for online schools"}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-muted-foreground mt-1 block text-xs leading-relaxed">
                    {o.hint}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border [&_svg]:size-3",
                    selected &&
                      "bg-foreground text-background border-transparent"
                  )}
                >
                  {selected ? <Check /> : null}
                </span>
              </button>
            )
          })}
        </div>
        <SaveStatus pending={isPending} savedAt={savedAt} className="px-4" />
        <p className="text-muted-foreground px-4 text-xs leading-relaxed">
          {t.footer}
        </p>
      </div>

      {value !== "physical" && readiness ? (
        <LiveReadiness summary={readiness} lang={lang} />
      ) : null}

      {value !== "physical" ? (
        <Link
          href={`/${lang}/school/configuration/live-classes`}
          className="text-primary inline-block px-4 text-sm hover:underline"
        >
          {t.moreSettings ?? "Live-class settings"}
        </Link>
      ) : null}
    </div>
  )
}
