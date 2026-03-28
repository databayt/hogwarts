// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { useEffect, useRef } from "react"
import type { FieldValues, Path, UseFormReturn } from "react-hook-form"

/**
 * Silently merges AI-extracted values into empty form fields.
 * Only fills fields the user hasn't touched yet.
 * Once a field is auto-filled, it won't be overwritten again.
 */
export function useAutoFillMerge<T extends FieldValues>(
  form: UseFormReturn<T>,
  contextData: Partial<T> | undefined
) {
  const mergedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!contextData) return

    const current = form.getValues()

    for (const [key, value] of Object.entries(contextData)) {
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        !mergedRef.current.has(key) &&
        isEmpty(current[key as keyof T])
      ) {
        form.setValue(key as Path<T>, value as T[Path<T>], {
          shouldDirty: false,
          shouldValidate: false,
        })
        mergedRef.current.add(key)
      }
    }
  }, [form, contextData])
}

function isEmpty(value: unknown): boolean {
  return value === "" || value === undefined || value === null
}
