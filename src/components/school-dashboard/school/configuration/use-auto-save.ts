import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

export function useAutoSave(
  saveFn: () => void | Promise<void>,
  isDirty: boolean
) {
  const pathname = usePathname()
  const prevPathname = useRef(pathname)
  const saveFnRef = useRef(saveFn)
  const isDirtyRef = useRef(isDirty)

  saveFnRef.current = saveFn
  isDirtyRef.current = isDirty

  useEffect(() => {
    if (prevPathname.current !== pathname && isDirtyRef.current) {
      saveFnRef.current()
    }
    prevPathname.current = pathname
  }, [pathname])
}
