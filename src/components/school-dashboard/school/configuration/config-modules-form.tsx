"use client"

import { useCallback, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorToast } from "@/components/atom/toast"
import { useSchool } from "@/components/school-dashboard/context/school-context"
import {
  toggleableModules,
  type PlatformNavItem,
} from "@/components/template/platform-sidebar/config"

import { updateEnabledModules } from "./actions"

// Short enough to feel real-time, long enough to coalesce rapid toggles
// (and Enable-all / Disable-all) into a single round-trip.
const DEBOUNCE_MS = 250

interface ConfigModulesFormProps {
  dictionary?: Record<string, string>
}

export function ConfigModulesForm({ dictionary }: ConfigModulesFormProps) {
  const { school } = useSchool()
  const router = useRouter()
  const [, startTransition] = useTransition()

  // Current enabled state: null = all enabled
  const initialEnabled = school.enabledModules as string[] | null
  const [enabledSet, setEnabledSet] = useState<Set<string>>(() => {
    if (!initialEnabled) {
      // null = all modules enabled
      return new Set(toggleableModules.map((m) => m.key))
    }
    return new Set(initialEnabled)
  })

  const allEnabled = enabledSet.size === toggleableModules.length

  // Debounced save: batches rapid toggles into a single server call.
  // `lastSavedRef` holds the last server-confirmed state so we can roll back
  // optimistic UI if the action ever fails.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<Set<string>>(enabledSet)

  const saveAndRefresh = useCallback(
    async (nextSet: Set<string>) => {
      const allOn = nextSet.size === toggleableModules.length
      const payload = allOn ? null : Array.from(nextSet)
      const previous = lastSavedRef.current

      try {
        const result = await updateEnabledModules(school.id, {
          enabledModules: payload,
        })

        if (result.success) {
          lastSavedRef.current = new Set(nextSet)
          // router.refresh() pulls a fresh RSC payload for the current route
          // AND its parent layouts -- so the dashboard left sidebar (which
          // filters by enabledModules) and the cards-sidebar "Modules" row
          // description ("X modules enabled") update without a page reload.
          startTransition(() => {
            router.refresh()
          })
        } else {
          setEnabledSet(previous)
          ErrorToast(result.error ?? "Failed to update modules")
        }
      } catch {
        setEnabledSet(previous)
        ErrorToast("Failed to update modules")
      }
    },
    [school.id, router]
  )

  const scheduleSave = useCallback(
    (nextSet: Set<string>) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null
        void saveAndRefresh(nextSet)
      }, DEBOUNCE_MS)
    },
    [saveAndRefresh]
  )

  const handleToggle = useCallback(
    (key: string, checked: boolean) => {
      setEnabledSet((prev) => {
        const next = new Set(prev)
        if (checked) {
          next.add(key)
        } else {
          next.delete(key)
        }
        scheduleSave(next)
        return next
      })
    },
    [scheduleSave]
  )

  const handleToggleAll = useCallback(() => {
    const newAllEnabled = !allEnabled
    const next = newAllEnabled
      ? new Set(toggleableModules.map((m) => m.key))
      : new Set<string>()

    setEnabledSet(next)
    scheduleSave(next)
  }, [allEnabled, scheduleSave])

  return (
    <div className="w-full max-w-[560px] space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {enabledSet.size}/{toggleableModules.length}
        </p>
        <button
          type="button"
          onClick={handleToggleAll}
          className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
        >
          {allEnabled
            ? (dictionary?.disableAll ?? "Disable all")
            : (dictionary?.enableAll ?? "Enable all")}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {toggleableModules.map((item) => (
          <ModuleCard
            key={item.key}
            item={item}
            enabled={enabledSet.has(item.key)}
            onToggle={handleToggle}
            dictionary={dictionary}
          />
        ))}
      </div>
    </div>
  )
}

function ModuleCard({
  item,
  enabled,
  onToggle,
  dictionary,
}: {
  item: PlatformNavItem
  enabled: boolean
  onToggle: (key: string, checked: boolean) => void
  dictionary?: Record<string, string>
}) {
  const label = dictionary?.[item.title] ?? item.title

  return (
    // Card visual mirrors config-sidebar.tsx exactly:
    //   inactive: default border, hover:border-foreground
    //   active:   border-foreground bg-muted
    // Keyboard semantics restored via role + aria-pressed + onKeyDown
    // (we lost native <button> semantics by switching to <Card>).
    <Card
      role="button"
      tabIndex={0}
      aria-pressed={enabled}
      onClick={() => onToggle(item.key, !enabled)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onToggle(item.key, !enabled)
        }
      }}
      className={cn(
        "hover:border-foreground cursor-pointer transition-colors select-none",
        enabled && "border-foreground bg-muted"
      )}
    >
      <CardHeader className="p-3">
        <CardTitle className="text-center text-sm capitalize">
          {label}
        </CardTitle>
      </CardHeader>
    </Card>
  )
}
