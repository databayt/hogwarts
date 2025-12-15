/**
 * Theme Hooks Suite - Theming System with Zustand & Next-Themes
 *
 * Manages app theming with:
 * - Multiple custom theme support (save/load/delete)
 * - Theme import/export (JSON files)
 * - Preset themes (built-in templates)
 * - CSS variable injection (real-time updates)
 * - Local storage persistence
 *
 * KEY HOOKS:
 * - useUserTheme(): Access theme editor state from Zustand store
 * - useThemeOperations(): Save/apply/delete themes with server actions
 * - useUserThemes(): Fetch user's saved themes list
 * - useThemeBuilder(): UI state for theme editor (tabs, preview mode)
 * - useThemeImportExport(): JSON import/export with validation
 * - usePresetThemes(): Load preset themes (registered at app startup)
 *
 * KEY PATTERNS:
 * - ZUSTAND STORE: Global theme state (not React Context)
 * - CSS VARIABLES: Dynamic injection for real-time theme switching
 * - LOCAL STORAGE: Fallback if user theme doesn't load
 * - FORM DATA: Server actions use FormData for type safety
 * - PRESET PRELOAD: Presets registered once at app startup
 *
 * GOTCHAS:
 * - Presets loaded from store (not re-registered) - register in theme-provider
 * - Export data URI may fail on very large themes (JSON serialization limit)
 * - Import validation is minimal (assumes valid theme structure)
 * - applyThemeToDocument modifies DOM styles (side-effect in hook)
 */

"use client"

import { useCallback, useState, useTransition } from "react"
import { useEditorStore } from "@/store/theme-editor-store"
import { useTheme as useNextTheme } from "next-themes"
import { toast } from "sonner"

import type { ThemeEditorState } from "@/types/theme-editor"

import {
  activateUserTheme,
  deleteUserTheme,
  getUserTheme,
  getUserThemes,
  saveUserTheme,
} from "./actions"
import { applyThemeToDocument, storeThemeInLocalStorage } from "./inject-theme"

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
      const mode = resolvedTheme === "dark" ? "dark" : "light"
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
        formData.append("name", name)
        formData.append("themeConfig", JSON.stringify(themeState))

        const result = await saveUserTheme(formData)

        if (result.error) {
          toast.error(result.error)
          return
        }

        toast.success("Theme saved successfully")
      })
    },
    [themeState]
  )

  const activateTheme = useCallback(async (themeId: string) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.append("themeId", themeId)

      const result = await activateUserTheme(formData)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Theme activated")
    })
  }, [])

  const deleteTheme = useCallback(async (themeId: string) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.append("themeId", themeId)

      const result = await deleteUserTheme(formData)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Theme deleted")
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
  const [activeTab, setActiveTab] = useState<
    "colors" | "typography" | "spacing" | "advanced"
  >("colors")
  const [previewMode, setPreviewMode] = useState<"component" | "page">(
    "component"
  )
  const { resolvedTheme } = useNextTheme()

  const currentMode = (resolvedTheme === "dark" ? "dark" : "light") as
    | "light"
    | "dark"

  return {
    activeTab,
    setActiveTab,
    previewMode,
    setPreviewMode,
    currentMode,
  }
}

/**
 * Hook for theme import/export
 */
export function useThemeImportExport() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const exportTheme = useCallback(async (themeName: string = "theme") => {
    setIsExporting(true)
    try {
      // Get current theme state from store
      const { themeState } = useEditorStore.getState()
      // Serialize with pretty-printing for user readability
      const dataStr = JSON.stringify(themeState, null, 2)
      // Create data URI for browser download
      // encodeURIComponent prevents issues with special characters
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
      const exportFileDefaultName = `${themeName}-${Date.now()}.json`

      // Trigger browser download via anchor click
      const linkElement = document.createElement("a")
      linkElement.setAttribute("href", dataUri)
      linkElement.setAttribute("download", exportFileDefaultName)
      linkElement.click()

      toast.success("Theme exported successfully")
    } catch (error) {
      toast.error("Failed to export theme")
      console.error(error)
    } finally {
      setIsExporting(false)
    }
  }, [])

  const importTheme = useCallback(
    async (file: File): Promise<ThemeEditorState | null> => {
      setIsImporting(true)
      try {
        const text = await file.text()
        const themeState = JSON.parse(text) as ThemeEditorState

        // Validate basic structure
        if (
          !themeState.styles ||
          !themeState.styles.light ||
          !themeState.styles.dark
        ) {
          throw new Error("Invalid theme file format")
        }

        toast.success("Theme imported successfully")
        return themeState
      } catch (error) {
        toast.error("Failed to import theme")
        console.error(error)
        return null
      } finally {
        setIsImporting(false)
      }
    },
    []
  )

  return {
    exportTheme,
    importTheme,
    isExporting,
    isImporting,
  }
}

/**
 * Hook for accessing preset store
 */
export function usePresetStore() {
  const { useThemePresetStore } = require("@/store/theme-preset-store")
  return useThemePresetStore()
}

/**
 * Hook for fetching preset themes
 *
 * NOTE: Presets are registered globally in theme-provider on app mount.
 * This hook just reads from the store - it doesn't register presets again.
 */
export function usePresetThemes() {
  const [presets, setPresets] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { useThemePresetStore } = require("@/store/theme-preset-store")
  const presetStore = useThemePresetStore()

  const fetchPresets = useCallback(async () => {
    setIsLoading(true)
    try {
      // Read presets from store (already registered by theme-provider at app startup)
      const allPresets = presetStore.getAllPresets()
      const presetsArray = Object.values(allPresets)

      // If store is empty, wait briefly for theme-provider initialization (race condition)
      // Most of the time presets are ready immediately
      if (presetsArray.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        const retryPresets = Object.values(presetStore.getAllPresets())
        setPresets(retryPresets)
      } else {
        setPresets(presetsArray)
      }
    } catch (error) {
      console.error("Failed to load presets:", error)
    } finally {
      setIsLoading(false)
    }
  }, []) // No dependencies - stable reference to prevent infinite loops

  return {
    presets,
    isLoading,
    fetchPresets,
  }
}
