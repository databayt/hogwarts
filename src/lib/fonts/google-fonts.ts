/**
 * Google Fonts Integration
 *
 * Utilities for loading Google Fonts dynamically via CSS link injection.
 * Based on tweakcn's google-fonts.ts pattern.
 */

export const GOOGLE_FONTS_API_URL = 'https://www.googleapis.com/webfonts/v1/webfonts'

/**
 * Build Google Fonts CSS API URL
 * @param family - Font family name (e.g., "Inter")
 * @param weights - Array of weights to load (e.g., ["400", "600", "700"])
 * @returns Google Fonts CSS URL
 */
export function buildFontCssUrl(family: string, weights: string[] = ['400']): string {
  const encodedFamily = encodeURIComponent(family)
  const weightsParam = weights.join(';') // Use semicolon for Google Fonts API v2
  return `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@${weightsParam}&display=swap`
}

/**
 * Load a Google Font dynamically by injecting a <link> tag
 * @param family - Font family name (e.g., "Inter")
 * @param weights - Array of weights to load (default: ["400", "700"])
 */
export function loadGoogleFont(family: string, weights: string[] = ['400', '700']): void {
  if (typeof document === 'undefined') return

  // Check if already loaded
  const href = buildFontCssUrl(family, weights)
  const existing = document.querySelector(`link[href="${href}"]`)
  if (existing) return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}
