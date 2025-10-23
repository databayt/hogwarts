/**
 * Theme Preset Store
 *
 * Zustand store for managing theme presets (built-in and user-saved).
 */

import { create } from 'zustand'
import type { ThemePreset } from '@/types/theme-editor'
import { getUserThemes } from '@/components/theme/actions'

interface ThemePresetStore {
  presets: Record<string, ThemePreset>
  registerPreset: (id: string, preset: ThemePreset) => void
  unregisterPreset: (id: string) => void
  updatePreset: (id: string, preset: ThemePreset) => void
  getPreset: (id: string) => ThemePreset | undefined
  getAllPresets: () => Record<string, ThemePreset>
  loadSavedPresets: () => Promise<void>
  unloadSavedPresets: () => void
}

// Default presets will be loaded from config
const defaultPresets: Record<string, ThemePreset> = {}

export const useThemePresetStore = create<ThemePresetStore>()((set, get) => ({
  presets: defaultPresets,

  registerPreset: (id: string, preset: ThemePreset) => {
    set((state) => ({
      presets: {
        ...state.presets,
        [id]: preset,
      },
    }))
  },

  unregisterPreset: (id: string) => {
    set((state) => {
      const { [id]: _, ...remainingPresets } = state.presets
      return {
        presets: remainingPresets,
      }
    })
  },

  updatePreset: (id: string, preset: ThemePreset) => {
    set((state) => ({
      presets: {
        ...state.presets,
        [id]: preset,
      },
    }))
  },

  getPreset: (id: string) => {
    return get().presets[id]
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
          acc[theme.id] = {
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
    set({ presets: defaultPresets })
  },
}))
