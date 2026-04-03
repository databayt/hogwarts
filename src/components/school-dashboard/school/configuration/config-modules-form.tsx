"use client"

import { useCallback, useState, useTransition } from "react"

import { cn } from "@/lib/utils"
import { useSchool } from "@/components/school-dashboard/context/school-context"
import {
  toggleableModules,
  type PlatformNavItem,
} from "@/components/template/platform-sidebar/config"

import { updateEnabledModules } from "./actions"

interface ConfigModulesFormProps {
  dictionary?: Record<string, string>
}

export function ConfigModulesForm({ dictionary }: ConfigModulesFormProps) {
  const { school } = useSchool()
  const [isPending, startTransition] = useTransition()

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

  const handleToggle = useCallback(
    (key: string, checked: boolean) => {
      setEnabledSet((prev) => {
        const next = new Set(prev)
        if (checked) {
          next.add(key)
        } else {
          next.delete(key)
        }

        // Save: if all enabled, store null (default); otherwise store the list
        const allOn = next.size === toggleableModules.length
        const payload = allOn ? null : Array.from(next)

        startTransition(async () => {
          await updateEnabledModules(school.id, {
            enabledModules: payload,
          })
        })

        return next
      })
    },
    [school.id]
  )

  const handleToggleAll = useCallback(() => {
    const newAllEnabled = !allEnabled
    const next = newAllEnabled
      ? new Set(toggleableModules.map((m) => m.key))
      : new Set<string>()

    setEnabledSet(next)

    const payload = newAllEnabled ? null : []
    startTransition(async () => {
      await updateEnabledModules(school.id, { enabledModules: payload })
    })
  }, [allEnabled, school.id])

  return (
    <div className="w-full max-w-[560px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">
            {enabledSet.size}/{toggleableModules.length}
          </p>
        </div>
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
            isPending={isPending}
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
  isPending,
  dictionary,
}: {
  item: PlatformNavItem
  enabled: boolean
  onToggle: (key: string, checked: boolean) => void
  isPending: boolean
  dictionary?: Record<string, string>
}) {
  const label = dictionary?.[item.title] ?? item.title

  return (
    <button
      type="button"
      className={cn(
        "cursor-pointer rounded-lg px-3 py-2.5 text-center text-xs font-medium transition-colors select-none",
        enabled
          ? "bg-muted border-foreground border-2 text-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      )}
      onClick={() => {
        if (!isPending) onToggle(item.key, !enabled)
      }}
    >
      {label}
    </button>
  )
}
