"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useState } from "react"

import { getSchoolDescription } from "./actions"
import { type DescriptionFormData } from "./validation"

interface UseDescriptionReturn {
  data: DescriptionFormData | null
  loading: boolean
  errorCode: string | null
  refresh: () => Promise<void>
}

export function useDescription(schoolId: string): UseDescriptionReturn {
  const [data, setData] = useState<DescriptionFormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorCode, setErrorCode] = useState<string | null>(null)

  const fetchDescription = useCallback(async () => {
    if (!schoolId) return

    try {
      setLoading(true)
      setErrorCode(null)
      const result = await getSchoolDescription(schoolId)

      if (result.success) {
        setData(result.data)
      } else {
        setErrorCode(result.code ?? "FETCH_FAILED")
      }
    } catch {
      setErrorCode("UNEXPECTED_ERROR")
    } finally {
      setLoading(false)
    }
  }, [schoolId])

  useEffect(() => {
    fetchDescription()
  }, [fetchDescription])

  return {
    data,
    loading,
    errorCode,
    refresh: fetchDescription,
  }
}
