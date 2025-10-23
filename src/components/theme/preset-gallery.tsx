/**
 * Preset Theme Gallery Component
 *
 * Displays all available preset themes in a grid.
 */

'use client'

import { useEffect } from 'react'
import { ThemeCard } from './card'
import { usePresetThemes, useThemeOperations, useUserTheme } from './use-theme'
import { Skeleton } from '@/components/ui/skeleton'

export function PresetGallery() {
  const { presets, isLoading, fetchPresets } = usePresetThemes()
  const { applyTheme, isPending } = useThemeOperations()
  const { themeState } = useUserTheme()

  // Fetch presets on mount
  useEffect(() => {
    fetchPresets()
  }, [fetchPresets])

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-[200px] w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (!presets || presets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">No preset themes available</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {presets.map((preset, index) => {
        return (
          <ThemeCard
            key={preset.label || index}
            preset={preset}
            isActive={false}
            onApply={() => {
              applyTheme({
                styles: preset.styles,
                currentMode: themeState.currentMode,
                hslAdjustments: { hueShift: 0, saturationScale: 1, lightnessScale: 1 },
              })
            }}
          />
        )
      })}
    </div>
  )
}
