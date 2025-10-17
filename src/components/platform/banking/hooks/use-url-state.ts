import { useCallback, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

/**
 * useUrlState - Custom hook for managing state in URL search params
 *
 * This hook provides a clean API for reading and updating URL search parameters
 * with React 19's useTransition for non-blocking updates.
 *
 * Benefits:
 * - State persists across page refreshes
 * - Shareable URLs
 * - Browser back/forward button support
 * - Non-blocking updates with useTransition
 *
 * @example
 * const [category, setCategory] = useUrlState('category')
 * setCategory('food') // Updates URL to ?category=food
 * setCategory(null) // Removes category param from URL
 */
export function useUrlState(key: string) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const value = searchParams.get(key)

  const setValue = useCallback(
    (newValue: string | null, options?: { scroll?: boolean }) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString())

        if (newValue === null || newValue === undefined) {
          params.delete(key)
        } else {
          params.set(key, newValue)
        }

        const queryString = params.toString()
        const newUrl = queryString ? `${pathname}?${queryString}` : pathname

        router.push(newUrl, {
          scroll: options?.scroll ?? false,
        })
      })
    },
    [key, pathname, router, searchParams]
  )

  return [value, setValue, isPending] as const
}

/**
 * useUrlStates - Custom hook for managing multiple URL search params
 *
 * Similar to useUrlState but for multiple parameters at once
 *
 * @example
 * const [params, setParams, isPending] = useUrlStates(['category', 'sort', 'page'])
 * setParams({ category: 'food', sort: 'asc' })
 */
export function useUrlStates(keys: string[]) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const values = Object.fromEntries(
    keys.map(key => [key, searchParams.get(key)])
  )

  const setValues = useCallback(
    (
      updates: Partial<Record<string, string | null>>,
      options?: { scroll?: boolean }
    ) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString())

        Object.entries(updates).forEach(([key, value]) => {
          if (value === null || value === undefined) {
            params.delete(key)
          } else {
            params.set(key, value)
          }
        })

        const queryString = params.toString()
        const newUrl = queryString ? `${pathname}?${queryString}` : pathname

        router.push(newUrl, {
          scroll: options?.scroll ?? false,
        })
      })
    },
    [pathname, router, searchParams]
  )

  return [values, setValues, isPending] as const
}
