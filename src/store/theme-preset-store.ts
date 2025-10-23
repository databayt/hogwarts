/**
 * Theme Preset Store
 *
 * Zustand store for managing theme presets (built-in and user-saved).
 * Based on tweakcn's theme-preset-store.ts pattern.
 */

import { create } from 'zustand'
import type { ThemePreset } from '@/types/theme-editor'
import { getUserThemes } from '@/components/theme/actions'

interface ThemePresetStore {
  presets: Record<string, ThemePreset>
  registerPreset: (name: string, preset: ThemePreset) => void
  unregisterPreset: (name: string) => void
  updatePreset: (name: string, preset: ThemePreset) => void
  getPreset: (name: string) => ThemePreset | undefined
  getAllPresets: () => Record<string, ThemePreset>
  loadSavedPresets: () => Promise<void>
  unloadSavedPresets: () => void
}

// Initialize with empty presets (will be populated by theme provider)
const defaultPresets: Record<string, ThemePreset> = {}

export const useThemePresetStore = create<ThemePresetStore>()((set, get) => ({
  presets: defaultPresets,

  registerPreset: (name: string, preset: ThemePreset) => {
    set((state) => ({
      presets: {
        ...state.presets,
        [name]: preset,
      },
    }))
  },

  unregisterPreset: (name: string) => {
    set((state) => {
      const { [name]: _, ...remainingPresets } = state.presets
      return {
        presets: remainingPresets,
      }
    })
  },

  updatePreset: (name: string, preset: ThemePreset) => {
    set((state) => ({
      presets: {
        ...state.presets,
        [name]: preset,
      },
    }))
  },

  getPreset: (name: string) => {
    return get().presets[name]
  },

  getAllPresets: () => {
    return get().presets
  },

  loadSavedPresets: async () => {
    try {
      const result = await getUserThemes()
      if (result.error) {
        console.error('Failed to load saved presets:', result.error)
        return
      }

      const savedThemes = result.themes || []
      const savedPresets = savedThemes.reduce(
        (acc, theme) => {
          const presetName = theme.name.toLowerCase().replace(/\s+/g, '-')
          acc[presetName] = {
            label: theme.name,
            styles: theme.themeConfig as any, // Type assertion needed
            source: 'SAVED',
            createdAt: theme.createdAt.toISOString(),
          }
          return acc
        },
        {} as Record<string, ThemePreset>
      )

      set((state) => ({
        presets: {
          ...state.presets,
          ...savedPresets,
        },
      }))
    } catch (error) {
      console.error('Failed to load saved presets:', error)
    }
  },

  unloadSavedPresets: () => {
    set((state) => {
      const builtInPresets = Object.entries(state.presets)
        .filter(([_, preset]) => preset.source === 'BUILT_IN')
        .reduce((acc, [name, preset]) => {
          acc[name] = preset
          return acc
        }, {} as Record<string, ThemePreset>)

      return { presets: builtInPresets }
    })
  },
}))
