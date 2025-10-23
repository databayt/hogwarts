/**
 * Preset Theme Gallery Component
 *
 * Displays all available preset themes in a grid.
 */

'use client'

import { useEffect, useMemo } from 'react'
import { PresetButton } from './preset-button'
import { usePresetThemes, useUserTheme } from './use-theme'
import { Skeleton } from '@/components/ui/skeleton'
import { useThemePresetStore } from '@/store/theme-preset-store'

export function PresetGallery() {
  const { presets, isLoading, fetchPresets } = usePresetThemes()
  const { themeState, applyThemePreset } = useUserTheme()
  const presetStore = useThemePresetStore()

  // Fetch presets on mount
  useEffect(() => {
    fetchPresets()
  }, [fetchPresets])

  // Convert presets to array for mapping
  const presetsArray = useMemo(() => {
    return Object.entries(presetStore.getAllPresets()).map(([name, preset]) => ({
      name,
      ...preset,
    }))
  }, [presetStore.presets])

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {Array.from({ length: 16 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] w-full" />
        ))}
      </div>
    )
  }

  if (!presetsArray || presetsArray.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">No preset themes available</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
      {presetsArray.map((preset) => {
        const isActive = themeState.preset === preset.name
        return (
          <PresetButton
            key={preset.name}
            preset={preset}
            isActive={isActive}
            onApply={() => applyThemePreset(preset.name)}
          />
        )
      })}
    </div>
  )
}
