/**
 * Font Utilities
 *
 * Core utilities for font management, loading, and manipulation.
 * Based on tweakcn's font handling pattern.
 */

import { type FontCategory } from '@/types/fonts'

// Categories mapped to their display names and common fallbacks
export const FONT_CATEGORIES = {
  'sans-serif': {
    label: 'Sans Serif',
    fallback: 'ui-sans-serif, system-ui, sans-serif',
  },
  serif: {
    label: 'Serif',
    fallback: 'ui-serif, Georgia, serif',
  },
  monospace: {
    label: 'Monospace',
    fallback:
      "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Monaco, Consolas, 'Courier New', monospace",
  },
  display: {
    label: 'Display',
    fallback: 'ui-serif, Georgia, serif',
  },
  handwriting: {
    label: 'Handwriting',
    fallback: 'cursive',
  },
} as const

// System fonts that should not be loaded from Google Fonts
export const SYSTEM_FONTS = [
  'ui-sans-serif',
  'ui-serif',
  'ui-monospace',
  'system-ui',
  'sans-serif',
  'serif',
  'monospace',
  'cursive',
  'fantasy',
  'georgia',
  'times new roman',
  'courier new',
  'menlo',
  'monaco',
  'consolas',
]

export const SYSTEM_FONTS_FALLBACKS = {
  'sans-serif': 'ui-sans-serif, sans-serif, system-ui',
  serif: 'ui-serif, serif',
  monospace: 'ui-monospace, monospace',
  display: 'ui-serif, serif',
  handwriting: 'cursive',
}

/**
 * Build font-family value for CSS
 * e.g., font: "Inter", category: "sans-serif" -> "Inter, ui-sans-serif, system-ui, sans-serif"
 */
export function buildFontFamily(fontFamily: string, category: FontCategory): string {
  return `${fontFamily}, ${SYSTEM_FONTS_FALLBACKS[category]}`
}

/**
 * Extract font family name from CSS font-family value
 * e.g., "Inter, ui-sans-serif, system-ui, sans-serif" -> "Inter"
 * e.g., "ui-sans-serif, system-ui" -> null (system font)
 */
export function extractFontFamily(fontFamilyValue: string): string | null {
  if (!fontFamilyValue) return null

  // Split by comma and get the first font
  const firstFont = fontFamilyValue.split(',')[0].trim()

  // Remove quotes if present
  const cleanFont = firstFont.replace(/['"]/g, '')

  // Skip system fonts
  if (SYSTEM_FONTS.includes(cleanFont.toLowerCase())) return null
  return cleanFont
}

/**
 * Get default weights for a font based on available variants
 */
export function getDefaultWeights(variants: string[]): string[] {
  const weightMap = ['100', '200', '300', '400', '500', '600', '700', '800', '900']
  const availableWeights = variants.filter((variant) => weightMap.includes(variant))

  if (availableWeights.length === 0) return ['400'] // Fallback to normal weight

  const preferredWeights = ['400', '500', '600', '700']
  const selectedWeights = preferredWeights.filter((weight) => availableWeights.includes(weight))

  // If none of the preferred weights are available, use the first two available
  if (selectedWeights.length === 0) {
    const fallbackWeights = availableWeights.slice(0, 2)
    return fallbackWeights.sort((a, b) => parseInt(a) - parseInt(b))
  }

  // Return up to 4 weights, starting with preferred ones
  const finalWeights = [
    ...selectedWeights,
    ...availableWeights.filter((w) => !selectedWeights.includes(w)),
  ].slice(0, 4)

  // Sort weights numerically for Google Fonts API requirement
  return finalWeights.sort((a, b) => parseInt(a) - parseInt(b))
}

/**
 * Check if a font is available using the native document.fonts API
 */
export function isFontLoaded(family: string, weight = '400'): boolean {
  if (typeof document === 'undefined' || !document.fonts) return false

  // Use the native FontFaceSet.check() method
  return document.fonts.check(`${weight} 16px "${family}"`)
}

/**
 * Wait for a font to load using the native document.fonts API
 */
export async function waitForFont(
  family: string,
  weight = '400',
  timeout = 3000
): Promise<boolean> {
  if (typeof document === 'undefined' || !document.fonts) return false

  const font = `${weight} 16px "${family}"`

  try {
    // Use the native document.fonts.load() method
    await Promise.race([
      document.fonts.load(font),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout)),
    ])

    return document.fonts.check(font)
  } catch {
    return false
  }
}

/**
 * Curated list of fonts used in our presets
 * Matches tweakcn's font selections
 */
export const CURATED_FONTS = {
  // Sans-serif fonts
  'Inter': { family: 'Inter', category: 'sans-serif' as FontCategory },
  'Roboto': { family: 'Roboto', category: 'sans-serif' as FontCategory },
  'Open Sans': { family: 'Open Sans', category: 'sans-serif' as FontCategory },
  'Poppins': { family: 'Poppins', category: 'sans-serif' as FontCategory },
  'Montserrat': { family: 'Montserrat', category: 'sans-serif' as FontCategory },
  'Plus Jakarta Sans': { family: 'Plus Jakarta Sans', category: 'sans-serif' as FontCategory },
  'DM Sans': { family: 'DM Sans', category: 'sans-serif' as FontCategory },
  'Geist': { family: 'Geist', category: 'sans-serif' as FontCategory },
  'Oxanium': { family: 'Oxanium', category: 'sans-serif' as FontCategory },
  'Architects Daughter': { family: 'Architects Daughter', category: 'handwriting' as FontCategory },

  // Serif fonts
  'Merriweather': { family: 'Merriweather', category: 'serif' as FontCategory },
  'Lora': { family: 'Lora', category: 'serif' as FontCategory },
  'Source Serif 4': { family: 'Source Serif 4', category: 'serif' as FontCategory },
  'Georgia': { family: 'Georgia', category: 'serif' as FontCategory },

  // Monospace fonts
  'JetBrains Mono': { family: 'JetBrains Mono', category: 'monospace' as FontCategory },
  'Fira Code': { family: 'Fira Code', category: 'monospace' as FontCategory },
  'Source Code Pro': { family: 'Source Code Pro', category: 'monospace' as FontCategory },
  'IBM Plex Mono': { family: 'IBM Plex Mono', category: 'monospace' as FontCategory },
  'Courier New': { family: 'Courier New', category: 'monospace' as FontCategory },
  'Menlo': { family: 'Menlo', category: 'monospace' as FontCategory },
} as const
