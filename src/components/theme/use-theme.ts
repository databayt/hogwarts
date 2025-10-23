/**
 * Theme React Hooks
 *
 * Custom hooks for accessing and manipulating theme data.
 * Uses Zustand store following tweakcn pattern.
 */

'use client'

import { useState, useCallback, useTransition } from 'react'
import { useTheme as useNextTheme } from 'next-themes'
import { useEditorStore } from '@/store/theme-editor-store'
import { applyThemeToDocument, storeThemeInLocalStorage } from './inject-theme'
import {
  getUserTheme,
  getUserThemes,
  saveUserTheme,
  activateUserTheme,
  deleteUserTheme,
} from './actions'
import type { ThemeEditorState } from '@/types/theme-editor'
import { toast } from 'sonner'

/**
 * Hook to access theme editor state
 */
export function useUserTheme() {
  const store = useEditorStore()
  return store
}

/**
 * Hook for theme operations (apply, save, delete, etc.)
 */
export function useThemeOperations() {
  const { themeState, setThemeState } = useEditorStore()
  const { resolvedTheme } = useNextTheme()
  const [isPending, startTransition] = useTransition()

  const applyTheme = useCallback(
    (newThemeState: ThemeEditorState) => {
      const mode = resolvedTheme === 'dark' ? 'dark' : 'light'
      const currentStyles = newThemeState.styles[mode]
      applyThemeToDocument(currentStyles, mode)
      storeThemeInLocalStorage(currentStyles)
      setThemeState(newThemeState)
    },
    [resolvedTheme, setThemeState]
  )

  const saveTheme = useCallback(
    async (name: string) => {
      startTransition(async () => {
        const formData = new FormData()
        formData.append('name', name)
        formData.append('themeConfig', JSON.stringify(themeState))

        const result = await saveUserTheme(formData)

        if (result.error) {
          toast.error(result.error)
          return
        }

        toast.success('Theme saved successfully')
      })
    },
    [themeState]
  )

  const activateTheme = useCallback(async (themeId: string) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.append('themeId', themeId)

      const result = await activateUserTheme(formData)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Theme activated')
    })
  }, [])

  const deleteTheme = useCallback(async (themeId: string) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.append('themeId', themeId)

      const result = await deleteUserTheme(formData)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Theme deleted')
    })
  }, [])

  return {
    applyTheme,
    saveTheme,
    activateTheme,
    deleteTheme,
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
 * Hook for building custom themes
 */
export function useThemeBuilder() {
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'spacing' | 'advanced'>(
    'colors'
  )
  const [previewMode, setPreviewMode] = useState<'component' | 'page'>('component')
  const { resolvedTheme } = useNextTheme()

  const currentMode = (resolvedTheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark'

  return {
    activeTab,
    setActiveTab,
    previewMode,
    setPreviewMode,
    currentMode,
  }
}
