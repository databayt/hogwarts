import * as React from "react"

export function useComposedRefs<T>(
  ...refs: Array<React.Ref<T> | undefined | null>
) {
  return React.useCallback(
    (element: T) => {
      refs.forEach((ref) => {
        if (typeof ref === "function") {
          ref(element)
        } else if (ref != null) {
          ;(ref as React.MutableRefObject<T | null>).current = element
        }
      })
    },
    [refs]
  )
}
