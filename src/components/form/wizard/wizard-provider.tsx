"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"

/**
 * Generic Wizard Data Provider Factory
 *
 * Creates a typed context provider + hook pair for managing entity data
 * during a URL-routed wizard flow. Handles loading, error states, retry
 * with exponential backoff, and optimistic local updates.
 *
 * @example
 * ```ts
 * // Create a typed provider for teachers
 * const { TeacherWizardProvider, useTeacherWizard } =
 *   createWizardProvider<TeacherDTO>("Teacher", { loadFn: getTeacher })
 *
 * // Use in layout
 * <TeacherWizardProvider>{children}</TeacherWizardProvider>
 *
 * // Use in step components
 * const { data, isLoading } = useTeacherWizard()
 * ```
 */

interface WizardDataContextValue<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  loadData: (id: string) => Promise<void>
  updateData: (partial: Partial<T>) => void
  reload: () => Promise<void>
  clearError: () => void
}

interface CreateWizardProviderOptions<T> {
  /** Server action to load entity data by ID */
  loadFn: (
    id: string
  ) => Promise<
    | { success: true; data: T }
    | { success: false; error?: string; code?: string }
  >
  /** Max retry attempts for access-denied errors (default: 3) */
  maxRetries?: number
}

export function createWizardProvider<T>(
  displayName: string,
  options: CreateWizardProviderOptions<T>
) {
  const { loadFn, maxRetries = 3 } = options

  const WizardDataContext = createContext<
    WizardDataContextValue<T> | undefined
  >(undefined)

  function Provider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<T | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [lastId, setLastId] = useState<string | null>(null)
    const mountedRef = useRef(true)

    useEffect(
      () => () => {
        mountedRef.current = false
      },
      []
    )

    const clearError = useCallback(() => setError(null), [])

    const wait = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms))

    const loadData = useCallback(
      async (id: string, retryCount = 0) => {
        setIsLoading(true)
        setError(null)
        setLastId(id)

        try {
          const result = await loadFn(id)

          if (result.success && result.data) {
            if (!mountedRef.current) return
            setData(result.data)
          } else {
            const errorMessage =
              ("error" in result && result.error) ||
              `Failed to load ${displayName}`
            const isAccessDenied =
              typeof errorMessage === "string" &&
              (errorMessage.includes("Access denied") ||
                errorMessage.includes("CROSS_TENANT_ACCESS_DENIED"))

            if (isAccessDenied && retryCount < maxRetries) {
              const delay = Math.min(1000 * Math.pow(2, retryCount), 5000)
              await wait(delay)
              return loadData(id, retryCount + 1)
            }

            if (!mountedRef.current) return
            setError(
              typeof errorMessage === "string"
                ? errorMessage
                : `Failed to load ${displayName}`
            )
          }
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : `Failed to load ${displayName}`

          if (
            errorMessage.includes("Access denied") &&
            retryCount < maxRetries
          ) {
            const delay = Math.min(1000 * Math.pow(2, retryCount), 5000)
            await wait(delay)
            return loadData(id, retryCount + 1)
          }

          if (!mountedRef.current) return
          setError(errorMessage)
        } finally {
          if (!mountedRef.current) return
          setIsLoading(false)
        }
      },
      [loadFn, maxRetries]
    )

    const reload = useCallback(async () => {
      if (lastId) await loadData(lastId)
    }, [lastId, loadData])

    const updateData = useCallback((partial: Partial<T>) => {
      setData((prev) => (prev ? { ...prev, ...partial } : null))
    }, [])

    const value: WizardDataContextValue<T> = {
      data,
      isLoading,
      error,
      loadData,
      updateData,
      reload,
      clearError,
    }

    return (
      <WizardDataContext.Provider value={value}>
        {children}
      </WizardDataContext.Provider>
    )
  }

  Provider.displayName = `${displayName}WizardProvider`

  function useWizardData(): WizardDataContextValue<T> {
    const context = useContext(WizardDataContext)
    if (!context) {
      throw new Error(
        `use${displayName}Wizard must be used within a ${displayName}WizardProvider`
      )
    }
    return context
  }

  return { Provider, useWizardData }
}
