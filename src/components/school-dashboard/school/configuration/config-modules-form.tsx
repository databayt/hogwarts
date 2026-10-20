"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { parseEnabledModules } from "@/lib/enabled-modules"
import { resolveActionError } from "@/lib/resolve-action-error"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorToast } from "@/components/atom/toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"
import { useSchool } from "@/components/school-dashboard/context/school-context"
import {
  toggleableModules,
  type PlatformNavItem,
} from "@/components/template/platform-sidebar/config"

import { updateEnabledModules } from "./actions"
import { formatCount, plural } from "./ui/format"

// Short enough to feel real-time, long enough to coalesce rapid toggles
// (and Enable-all / Disable-all) into a single round-trip.
const DEBOUNCE_MS = 250

interface ConfigModulesFormProps {
  /** platform.sidebar — fallback labels for modules not in schoolSettings. */
  dictionary?: Record<string, string>
}

export function ConfigModulesForm({ dictionary }: ConfigModulesFormProps) {
  const { school, setEnabledModules } = useSchool()
  const router = useRouter()
  const [, startTransition] = useTransition()
  const { dictionary: fullDict } = useDictionary()
  const { locale } = useLocale()
  const t: Partial<Dictionary["schoolSettings"]["modules"]> =
    (fullDict as Dictionary | null)?.schoolSettings?.modules ?? {}
  const itemText = t.items as
    | Record<string, { label?: string; description?: string }>
    | undefined

  const total = toggleableModules.length
  const [confirmOpen, setConfirmOpen] = useState(false)

  // The school context is the single source of truth: writing to it moves
  // the dashboard sidebar in the same frame as the card, and the save below
  // only has to make the server agree. null = all enabled.
  const current = parseEnabledModules(school.enabledModules)
  const enabledSet = new Set(current ?? toggleableModules.map((m) => m.key))
  const allEnabled = enabledSet.size === total

  // Debounced save: batches rapid clicks into a single server call.
  // `lastSavedRef` holds the last server-confirmed state so a failed save
  // rolls the cards and the sidebar back together.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string[] | null>(current)

  const failMessage = t.updateError ?? "Couldn't update modules. Try again."

  async function save(next: string[] | null) {
    try {
      const result = await updateEnabledModules(school.id, {
        enabledModules: next,
      })

      if (result.success) {
        lastSavedRef.current = next
        // Brings the server's copy in line (the navigator's "Modules" row
        // count, the layout's school prop) in the background.
        startTransition(() => {
          router.refresh()
        })
      } else {
        setEnabledModules(lastSavedRef.current)
        ErrorToast(
          result.error
            ? resolveActionError(result.error, fullDict)
            : failMessage
        )
      }
    } catch {
      setEnabledModules(lastSavedRef.current)
      ErrorToast(failMessage)
    }
  }

  function apply(nextSet: Set<string>) {
    const next = nextSet.size === total ? null : Array.from(nextSet)
    setEnabledModules(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      void save(next)
    }, DEBOUNCE_MS)
  }

  function handleToggle(key: string) {
    const next = new Set(enabledSet)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    apply(next)
  }

  function setAll(on: boolean) {
    apply(on ? new Set(toggleableModules.map((m) => m.key)) : new Set())
  }

  const countLabel = plural(
    t.count as Record<string, string> | undefined,
    enabledSet.size,
    locale
  ).replace("{total}", formatCount(total, locale))

  return (
    <div className="w-full max-w-[560px] space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">{countLabel}</p>
        <button
          type="button"
          onClick={() => (allEnabled ? setConfirmOpen(true) : setAll(true))}
          className="text-primary text-sm font-medium hover:underline focus-visible:underline focus-visible:outline-none"
        >
          {allEnabled
            ? (t.disableAll ?? "Disable all")
            : (t.enableAll ?? "Enable all")}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {toggleableModules.map((item) => (
          <ModuleCard
            key={item.key}
            item={item}
            enabled={enabledSet.has(item.key)}
            onToggle={handleToggle}
            label={
              itemText?.[item.key]?.label ??
              dictionary?.[item.title] ??
              item.title
            }
          />
        ))}
      </div>

      {t.footer ? (
        <p className="text-muted-foreground text-xs leading-relaxed">
          {t.footer}
        </p>
      ) : null}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t.confirmTitle ?? "Turn off every module?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.confirmDescription ??
                "Everyone's sidebar will show only Overview, School, Profile and Settings."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel ?? "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={() => setAll(false)}>
              {t.confirm ?? "Disable all"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ModuleCard({
  item,
  enabled,
  onToggle,
  label,
}: {
  item: PlatformNavItem
  enabled: boolean
  onToggle: (key: string) => void
  label: string
}) {
  return (
    // Card visual mirrors config-sidebar.tsx:
    //   inactive: default border, hover:border-foreground
    //   active:   border-foreground bg-muted
    <Card
      role="button"
      tabIndex={0}
      aria-pressed={enabled}
      onClick={() => onToggle(item.key)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onToggle(item.key)
        }
      }}
      className={cn(
        "hover:border-foreground cursor-pointer transition-colors select-none",
        enabled && "border-foreground bg-muted"
      )}
    >
      <CardHeader className="p-3">
        <CardTitle className="text-center text-sm">{label}</CardTitle>
      </CardHeader>
    </Card>
  )
}
