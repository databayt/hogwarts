/**
 * Theme React Hooks
 *
 * Custom hooks for accessing and manipulating theme data.
 */

'use client'

import { useContext, useState, useCallback, useTransition } from 'react'
import { useTheme as useNextTheme } from 'next-themes'
import { ThemeContext } from './theme-provider'
import {
  applyThemeToDocument,
  storeThemeInLocalStorage,
  exportThemeAsJSON,
  importThemeFromJSON,
} from './inject-theme'
import {
  getUserTheme,
  getUserThemes,
  saveUserTheme,
  activateUserTheme,
  deleteUserTheme,
  applyPresetTheme,
  getPresetThemes,
} from './actions'
import type { ThemeConfig } from './types'
import { toast } from 'sonner'

/**
 * Hook to access theme context
 */
export function useUserTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useUserTheme must be used within ThemeProvider')
  }
  return context
}

/**
 * Hook for theme operations (apply, save, delete, etc.)
 */
export function useThemeOperations() {
  const { theme: currentTheme, refreshTheme } = useUserTheme()
  const { theme: systemTheme } = useNextTheme()
  const [isPending, startTransition] = useTransition()

  const applyTheme = useCallback(
    (themeConfig: ThemeConfig) => {
      const mode = systemTheme === 'dark' ? 'dark' : 'light'
      applyThemeToDocument(themeConfig, mode)
      storeThemeInLocalStorage(themeConfig)
    },
    [systemTheme]
  )

  const saveTheme = useCallback(
    async (name: string, themeConfig: ThemeConfig) => {
      startTransition(async () => {
        const formData = new FormData()
        formData.append('name', name)
        formData.append('themeConfig', JSON.stringify(themeConfig))

        const result = await saveUserTheme(formData)

        if (result.error) {
          toast.error(result.error)
          return
        }

        toast.success('Theme saved successfully')
        await refreshTheme()
      })
    },
    [refreshTheme]
  )

  const activateTheme = useCallback(
    async (themeId: string) => {
      startTransition(async () => {
        const formData = new FormData()
        formData.append('themeId', themeId)

        const result = await activateUserTheme(formData)

        if (result.error) {
          toast.error(result.error)
          return
        }

        toast.success('Theme activated')
        await refreshTheme()
      })
    },
    [refreshTheme]
  )

  const deleteTheme = useCallback(
    async (themeId: string) => {
      startTransition(async () => {
        const formData = new FormData()
        formData.append('themeId', themeId)

        const result = await deleteUserTheme(formData)

        if (result.error) {
          toast.error(result.error)
          return
        }

        toast.success('Theme deleted')
        await refreshTheme()
      })
    },
    [refreshTheme]
  )

  const applyPreset = useCallback(
    async (presetId: string) => {
      startTransition(async () => {
        const formData = new FormData()
        formData.append('presetId', presetId)

        const result = await applyPresetTheme(formData)

        if (result.error) {
          toast.error(result.error)
          return
        }

        toast.success('Preset theme applied')
        await refreshTheme()
      })
    },
    [refreshTheme]
  )

  return {
    applyTheme,
    saveTheme,
    activateTheme,
    deleteTheme,
    applyPreset,
    isPending,
  }
}

/**
 * Hook for fetching all user themes
 */
export function useUserThemes() {
  const [themes, setThemes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchThemes = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const result = await getUserThemes()

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    setThemes(result.themes || [])
    setIsLoading(false)
  }, [])

  return {
    themes,
    isLoading,
    error,
    fetchThemes,
  }
}

/**
 * Hook for fetching preset themes
 */
export function usePresetThemes() {
  const [presets, setPresets] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchPresets = useCallback(async () => {
    setIsLoading(true)
    const result = await getPresetThemes()
    setPresets(result.presets || [])
    setIsLoading(false)
  }, [])

  return {
    presets,
    isLoading,
    fetchPresets,
  }
}

/**
 * Hook for theme import/export
 */
export function useThemeImportExport() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const exportTheme = useCallback(async (themeConfig: ThemeConfig, filename?: string) => {
    setIsExporting(true)
    try {
      exportThemeAsJSON(themeConfig, filename)
      toast.success('Theme exported successfully')
    } catch (error) {
      toast.error('Failed to export theme')
      console.error(error)
    } finally {
      setIsExporting(false)
    }
  }, [])

  const importTheme = useCallback(async (file: File): Promise<ThemeConfig | null> => {
    setIsImporting(true)
    try {
      const themeConfig = await importThemeFromJSON(file)
      toast.success('Theme imported successfully')
      return themeConfig
    } catch (error) {
      toast.error('Failed to import theme')
      console.error(error)
      return null
    } finally {
      setIsImporting(false)
    }
  }, [])

  return {
    exportTheme,
    importTheme,
    isExporting,
    isImporting,
  }
}

/**
 * Hook for building custom themes
 */
export function useThemeBuilder() {
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'spacing' | 'advanced'>(
    'colors'
  )
  const [previewMode, setPreviewMode] = useState<'component' | 'page'>('component')
  const { theme: systemTheme } = useNextTheme()

  const currentMode = (systemTheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark'

  return {
    activeTab,
    setActiveTab,
    previewMode,
    setPreviewMode,
    currentMode,
  }
}
