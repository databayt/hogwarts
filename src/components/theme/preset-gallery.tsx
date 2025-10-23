/**
 * Preset Theme Gallery Component
 *
 * Displays all available preset themes in a grid.
 */

'use client'

import { useEffect } from 'react'
import { PresetButton } from './preset-button'
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
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {Array.from({ length: 16 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] w-full" />
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
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
      {presets.map((preset, index) => {
        return (
          <PresetButton
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
