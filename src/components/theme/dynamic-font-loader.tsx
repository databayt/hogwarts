/**
 * Dynamic Font Loader Component
 *
 * Automatically loads Google Fonts when theme changes.
 * Based on tweakcn's dynamic-font-loader.tsx pattern.
 */

'use client'

import { useEffect, useMemo } from 'react'
import { useEditorStore } from '@/store/theme-editor-store'
import { extractFontFamily, getDefaultWeights } from '@/lib/fonts'
import { loadGoogleFont } from '@/lib/fonts/google-fonts'

export function DynamicFontLoader() {
  const { themeState } = useEditorStore()

  // Extract fonts from light mode styles (fonts are common to both modes)
  const fontSans = themeState.styles.light['font-sans']
  const fontSerif = themeState.styles.light['font-serif']
  const fontMono = themeState.styles.light['font-mono']

  const currentFonts = useMemo(() => {
    return {
      sans: fontSans,
      serif: fontSerif,
      mono: fontMono,
    } as const
  }, [fontSans, fontSerif, fontMono])

  useEffect(() => {
    try {
      Object.entries(currentFonts).forEach(([_type, fontValue]) => {
        const fontFamily = extractFontFamily(fontValue)
        if (fontFamily) {
          const weights = getDefaultWeights(['400', '500', '600', '700'])
          loadGoogleFont(fontFamily, weights)
        }
      })
    } catch (e) {
      console.warn('DynamicFontLoader: Failed to load Google fonts:', e)
    }
  }, [currentFonts])

  return null
}
