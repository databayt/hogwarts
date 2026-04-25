"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useState } from "react"

import { getSchoolLocation } from "./actions"
import { type LocationFormData } from "./validation"

interface UseLocationReturn {
  data: LocationFormData | null
  loading: boolean
  errorCode: string | null
  refresh: () => Promise<void>
}

export function useLocation(schoolId: string): UseLocationReturn {
  const [data, setData] = useState<LocationFormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorCode, setErrorCode] = useState<string | null>(null)

  const fetchLocation = useCallback(async () => {
    if (!schoolId) {
      setErrorCode("MISSING_SCHOOL_ID")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setErrorCode(null)
      const result = await getSchoolLocation(schoolId)

      if (result.success && result.data) {
        setData(result.data)
      } else if (result.success && !result.data) {
        setData(null)
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
    fetchLocation()
  }, [fetchLocation])

  return {
    data,
    loading,
    errorCode,
    refresh: fetchLocation,
  }
}
