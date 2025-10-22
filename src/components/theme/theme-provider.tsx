/**
 * Theme Context Provider
 *
 * Provides theme context to the entire application.
 * Fetches user theme from database and applies it at runtime.
 */

'use client'

import {
  createContext,
  type ReactNode,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react'
import { useTheme as useNextTheme } from 'next-themes'
import type { ThemeConfig, UserThemeData } from './types'
import { defaultThemeConfig } from './config'
import {
  applyThemeToDocument,
  getThemeFromLocalStorage,
  storeThemeInLocalStorage,
  getCurrentThemeMode,
} from './inject-theme'
import { getUserTheme } from './actions'

interface ThemeContextValue {
  theme: UserThemeData | null
  themeConfig: ThemeConfig
  isLoading: boolean
  refreshTheme: () => Promise<void>
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
  initialTheme?: UserThemeData | null
}

export function UserThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const [theme, setTheme] = useState<UserThemeData | null>(initialTheme || null)
  const [isLoading, setIsLoading] = useState(!initialTheme)
  const { theme: systemTheme, resolvedTheme } = useNextTheme()

  // Get effective theme config (user theme or default)
  const themeConfig = useMemo<ThemeConfig>(() => {
    if (theme?.themeConfig) {
      return theme.themeConfig as ThemeConfig
    }
    return defaultThemeConfig
  }, [theme])

  // Refresh theme from database
  const refreshTheme = useCallback(async () => {
    setIsLoading(true)
    const result = await getUserTheme()

    if (result.theme) {
      setTheme(result.theme as unknown as UserThemeData)
      storeThemeInLocalStorage(result.theme.themeConfig as unknown as ThemeConfig)
    } else {
      setTheme(null)
      // Use default theme
      storeThemeInLocalStorage(defaultThemeConfig)
    }

    setIsLoading(false)
  }, [])

  // Apply theme on mount and when theme changes
  useEffect(() => {
    // Get current mode
    const mode = getCurrentThemeMode()

    // Apply theme to document
    applyThemeToDocument(themeConfig, mode)
  }, [themeConfig])

  // Re-apply theme when dark mode toggles
  useEffect(() => {
    if (!resolvedTheme) return

    const mode = resolvedTheme === 'dark' ? 'dark' : 'light'
    applyThemeToDocument(themeConfig, mode)
  }, [resolvedTheme, themeConfig])

  // Initial fetch on mount (if no initial theme provided)
  useEffect(() => {
    if (!initialTheme) {
      refreshTheme()
    }
  }, [initialTheme, refreshTheme])

  const contextValue: ThemeContextValue = {
    theme,
    themeConfig,
    isLoading,
    refreshTheme,
  }

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}
