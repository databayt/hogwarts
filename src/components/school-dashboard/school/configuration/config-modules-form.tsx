"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { parseEnabledModules } from "@/lib/enabled-modules"
import { resolveActionError } from "@/lib/resolve-action-error"
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
import { Switch } from "@/components/ui/switch"
import { ErrorToast } from "@/components/atom/toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"
import { useSchool } from "@/components/school-dashboard/context/school-context"
import {
  toggleableModules,
  type PlatformNavItem,
} from "@/components/template/platform-sidebar/config"
import { Icons } from "@/components/template/platform-sidebar/icons"

import { updateEnabledModules } from "./actions"
import { formatCount, plural } from "./ui/format"
import { SettingsGroup, SettingsRow } from "./ui/settings-group"

// Short enough to feel real-time, long enough to coalesce rapid toggles
// (and Enable-all / Disable-all) into a single round-trip.
const DEBOUNCE_MS = 250

// Module keys grouped the way an admin thinks about them. Any toggleable
// module missing here (a newly added nav item) lands in the last group, so
// nothing silently disappears from the settings list.
const GROUPS: Array<{ key: string; modules: string[] }> = [
  {
    key: "learning",
    modules: [
      "subjects",
      "classrooms",
      "timetable",
      "attendance",
      "exams",
      "grades",
      "myAssignments",
      "library",
      "lumos",
      "liveClasses",
    ],
  },
  {
    key: "people",
    modules: ["students", "teachers", "parents", "admission", "parentPortal"],
  },
  { key: "finance", modules: ["finance", "sales", "billing"] },
  { key: "communication", modules: ["announcements", "events"] },
  {
    key: "transport",
    modules: [
      "transportation",
      "transportationTrips",
      "transportationFees",
      "myTransportation",
    ],
  },
  { key: "insights", modules: ["compliance", "charts", "stats"] },
]

const byKey = new Map(toggleableModules.map((m) => [m.key, m]))
const grouped = (() => {
  const placed = new Set(GROUPS.flatMap((g) => g.modules))
  const rest = toggleableModules
    .filter((m) => !placed.has(m.key))
    .map((m) => m.key)
  return GROUPS.map((g, i) => ({
    key: g.key,
    items: [...g.modules, ...(i === GROUPS.length - 1 ? rest : [])]
      .map((k) => byKey.get(k))
      .filter((m): m is PlatformNavItem => Boolean(m)),
  })).filter((g) => g.items.length > 0)
})()

interface ConfigModulesFormProps {
  /** platform.sidebar — fallback labels for modules not in schoolSettings. */
  dictionary?: Record<string, string>
}

export function ConfigModulesForm({ dictionary }: ConfigModulesFormProps) {
  const { school } = useSchool()
  const router = useRouter()
  const [, startTransition] = useTransition()
  const { dictionary: fullDict } = useDictionary()
  const { locale } = useLocale()
  const t: Partial<Dictionary["schoolSettings"]["modules"]> =
    (fullDict as Dictionary | null)?.schoolSettings?.modules ?? {}
  const groupTitles = t.groups as Record<string, string> | undefined
  const itemText = t.items as
    | Record<string, { label?: string; description?: string }>
    | undefined

  const total = toggleableModules.length
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Current enabled state: null = all enabled
  const [enabledSet, setEnabledSet] = useState<Set<string>>(() => {
    const initialEnabled = parseEnabledModules(school.enabledModules)
    return initialEnabled
      ? new Set(initialEnabled)
      : new Set(toggleableModules.map((m) => m.key))
  })

  const allEnabled = enabledSet.size === total

  // Debounced save: batches rapid toggles into a single server call.
  // `lastSavedRef` holds the last server-confirmed state so we can roll back
  // optimistic UI if the action ever fails.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<Set<string>>(enabledSet)

  const failMessage = t.updateError ?? "Couldn't update modules. Try again."

  async function saveAndRefresh(nextSet: Set<string>) {
    const payload = nextSet.size === total ? null : Array.from(nextSet)
    const previous = lastSavedRef.current

    try {
      const result = await updateEnabledModules(school.id, {
        enabledModules: payload,
      })

      if (result.success) {
        lastSavedRef.current = new Set(nextSet)
        // router.refresh() pulls a fresh RSC payload for the current route
        // AND its parent layouts -- so the dashboard left sidebar (which
        // filters by enabledModules) and the navigator's "Modules" row
        // description update without a page reload.
        startTransition(() => {
          router.refresh()
        })
      } else {
        setEnabledSet(previous)
        ErrorToast(
          result.error
            ? resolveActionError(result.error, fullDict)
            : failMessage
        )
      }
    } catch {
      setEnabledSet(previous)
      ErrorToast(failMessage)
    }
  }

  function scheduleSave(nextSet: Set<string>) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      void saveAndRefresh(nextSet)
    }, DEBOUNCE_MS)
  }

  function handleToggle(key: string, checked: boolean) {
    const next = new Set(enabledSet)
    if (checked) next.add(key)
    else next.delete(key)
    setEnabledSet(next)
    scheduleSave(next)
  }

  function setAll(on: boolean) {
    const next = on
      ? new Set(toggleableModules.map((m) => m.key))
      : new Set<string>()
    setEnabledSet(next)
    scheduleSave(next)
  }

  const countLabel = plural(
    t.count as Record<string, string> | undefined,
    enabledSet.size,
    locale
  ).replace("{total}", formatCount(total, locale))

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3 px-4">
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

      {grouped.map((group) => (
        <SettingsGroup key={group.key} title={groupTitles?.[group.key]}>
          {group.items.map((item) => (
            <ModuleRow
              key={item.key}
              item={item}
              enabled={enabledSet.has(item.key)}
              onToggle={handleToggle}
              text={itemText?.[item.key]}
              fallbackLabel={dictionary?.[item.title] ?? item.title}
            />
          ))}
        </SettingsGroup>
      ))}

      {t.footer ? (
        <p className="text-muted-foreground px-4 text-xs leading-relaxed">
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

function ModuleRow({
  item,
  enabled,
  onToggle,
  text,
  fallbackLabel,
}: {
  item: PlatformNavItem
  enabled: boolean
  onToggle: (key: string, checked: boolean) => void
  text?: { label?: string; description?: string }
  fallbackLabel: string
}) {
  const Icon = Icons[item.icon]
  const label = text?.label ?? fallbackLabel
  const id = `module-${item.key}`

  return (
    <SettingsRow
      icon={Icon ? <Icon /> : null}
      label={<label htmlFor={id}>{label}</label>}
      description={text?.description}
    >
      <Switch
        id={id}
        checked={enabled}
        onCheckedChange={(checked) => onToggle(item.key, checked)}
      />
    </SettingsRow>
  )
}
