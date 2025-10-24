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

  // Fetch presets on mount (fetchPresets has stable reference now)
  useEffect(() => {
    fetchPresets()
  }, [fetchPresets])

  // Convert presets from hook to array (presets already includes all registered presets)
  const presetsArray = useMemo(() => {
    if (!presets || presets.length === 0) {
      // Fallback: read directly from store if hook hasn't populated yet
      return Object.entries(presetStore.getAllPresets()).map(([name, preset]) => ({
        name,
        ...preset,
      }))
    }
    // Use presets from hook (already formatted correctly)
    return presets.map((preset, index) => ({
      name: preset.label?.toLowerCase().replace(/\s+/g, '-') || `preset-${index}`,
      ...preset,
    }))
  }, [presets]) // Only depend on presets array from hook (stable reference)

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 16 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] w-[140px]" />
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
    <div className="flex flex-wrap gap-3">
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
