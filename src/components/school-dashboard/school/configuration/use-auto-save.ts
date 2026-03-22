import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

export function useAutoSave(
  saveFn: () => void | Promise<void>,
  isDirty: boolean,
  debounceMs = 1000
) {
  const pathname = usePathname()
  const prevPathname = useRef(pathname)
  const saveFnRef = useRef(saveFn)
  const isDirtyRef = useRef(isDirty)

  saveFnRef.current = saveFn
  isDirtyRef.current = isDirty

  // Save on navigation away
  useEffect(() => {
    if (prevPathname.current !== pathname && isDirtyRef.current) {
      saveFnRef.current()
    }
    prevPathname.current = pathname
  }, [pathname])

  // Debounced save when isDirty becomes true
  useEffect(() => {
    if (!isDirty) return
    const timer = setTimeout(() => {
      saveFnRef.current()
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [isDirty, debounceMs])
}
