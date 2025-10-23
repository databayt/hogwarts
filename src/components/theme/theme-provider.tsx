/**
 * Theme Context Provider
 *
 * Provides theme context to the entire application.
 * Fetches user theme from database and applies it at runtime.
 * Uses Zustand store for state management following tweakcn pattern.
 */

'use client'

import { type ReactNode, useEffect, useCallback } from 'react'
import { useTheme as useNextTheme } from 'next-themes'
import { useEditorStore } from '@/store/theme-editor-store'
import { applyThemeToDocument, getCurrentThemeMode } from './inject-theme'
import { getUserTheme } from './actions'
import type { ThemeEditorState } from '@/types/theme-editor'
import { defaultThemeState } from './config'

interface ThemeProviderProps {
  children: ReactNode
  initialTheme?: any
}

export function UserThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const { themeState, setThemeState } = useEditorStore()
  const { resolvedTheme } = useNextTheme()

  // Load initial theme from server if provided
  useEffect(() => {
    if (initialTheme?.themeConfig) {
      const config = initialTheme.themeConfig as ThemeEditorState
      setThemeState(config)
    }
  }, [initialTheme, setThemeState])

  // Apply theme on mount and when theme changes
  useEffect(() => {
    const mode = getCurrentThemeMode()
    const currentStyles = themeState.styles[mode]
    applyThemeToDocument(currentStyles, mode)
  }, [themeState])

  // Re-apply theme when dark mode toggles
  useEffect(() => {
    if (!resolvedTheme) return

    const mode = resolvedTheme === 'dark' ? 'dark' : 'light'
    const currentStyles = themeState.styles[mode]
    applyThemeToDocument(currentStyles, mode)
  }, [resolvedTheme, themeState])

  return <>{children}</>
}
