/**
 * Theme Presets
 *
 * Collection of beautiful pre-configured themes.
 * Each theme includes light and dark mode variants in flat structure.
 * Following tweakcn pattern with HEX colors for presets.
 */

import type { ThemePreset } from '@/types/theme-editor'
import {
  defaultLightThemeStyles,
  defaultDarkThemeStyles,
  DEFAULT_FONT_SANS,
  DEFAULT_FONT_SERIF,
  DEFAULT_FONT_MONO,
} from './config'

// Legacy preset interface for backwards compatibility with actions.ts
export interface LegacyThemePreset {
  id: string
  name: string
  description: string
  config: {
    name: string
    light: any
    dark: any
  }
}

// Built-in presets in new flat structure
export const builtInPresets: ThemePreset[] = [
  // Default neutral theme
  {
    label: 'Default',
    source: 'BUILT_IN',
    styles: {
      light: defaultLightThemeStyles,
      dark: defaultDarkThemeStyles,
    },
  },
]

// Legacy presets array for backwards compatibility
export const themePresets: LegacyThemePreset[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Clean and professional neutral theme',
    config: {
      name: 'Default',
      light: defaultLightThemeStyles,
      dark: defaultDarkThemeStyles,
    },
  },
]

// Helper to get preset by label
export function getPresetByLabel(label: string): ThemePreset | undefined {
  return builtInPresets.find((preset) => preset.label === label)
}

// Helper to get preset by ID (legacy)
export function getPresetById(id: string): LegacyThemePreset | undefined {
  return themePresets.find((preset) => preset.id === id)
}
