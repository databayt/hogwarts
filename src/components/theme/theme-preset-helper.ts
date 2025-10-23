/**
 * Theme Preset Helper
 *
 * Utility functions for working with theme presets.
 * Based on tweakcn's theme-preset-helper.ts pattern.
 */

import type { ThemeStyles } from '@/types/theme-editor'
import { useThemePresetStore } from '@/store/theme-preset-store'
import { defaultThemeState } from './config'

/**
 * Get theme styles for a preset by name
 *
 * Merges default theme styles with preset-specific overrides.
 * Falls back to default theme if preset not found.
 *
 * @param name - Preset name (e.g., 'modern-minimal', 'violet-bloom')
 * @returns Complete theme styles with light and dark modes
 */
export function getPresetThemeStyles(name: string): ThemeStyles {
  const defaultTheme = defaultThemeState.styles

  // Return default theme for 'default' preset
  if (name === 'default') {
    return defaultTheme
  }

  // Get preset from store
  const store = useThemePresetStore.getState()
  const preset = store.getPreset(name)

  // Fallback to default if preset not found
  if (!preset) {
    console.warn(`Preset "${name}" not found, falling back to default theme`)
    return defaultTheme
  }

  // Merge default styles with preset overrides
  return {
    light: {
      ...defaultTheme.light,
      ...(preset.styles.light || {}),
    },
    dark: {
      ...defaultTheme.dark,
      ...(preset.styles.light || {}), // Apply light as base
      ...(preset.styles.dark || {}), // Override with dark-specific styles
    },
  }
}

/**
 * Get all available preset names
 *
 * @returns Array of preset names
 */
export function getAllPresetNames(): string[] {
  const store = useThemePresetStore.getState()
  return Object.keys(store.getAllPresets())
}

/**
 * Check if a preset exists
 *
 * @param name - Preset name
 * @returns True if preset exists
 */
export function presetExists(name: string): boolean {
  const store = useThemePresetStore.getState()
  return !!store.getPreset(name)
}
