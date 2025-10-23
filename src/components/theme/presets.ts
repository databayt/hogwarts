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

// Helper to register built-in presets
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

// Helper to get preset by label
export function getPresetByLabel(label: string): ThemePreset | undefined {
  return builtInPresets.find((preset) => preset.label === label)
}
