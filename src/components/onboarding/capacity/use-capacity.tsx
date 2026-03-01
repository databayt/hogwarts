"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"

import { getSchoolCapacity } from "./actions"
import { type CapacityFormData } from "./validation"

interface CapacityData extends CapacityFormData {
  schoolLevel: string
}

interface UseCapacityReturn {
  data: CapacityData | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useCapacity(schoolId: string): UseCapacityReturn {
  const [data, setData] = useState<CapacityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCapacity = async () => {
    if (!schoolId) return

    try {
      setLoading(true)
      setError(null)
      const result = await getSchoolCapacity(schoolId)

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || "Failed to fetch capacity")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("Error fetching capacity:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCapacity()
  }, [schoolId])

  const refresh = async () => {
    await fetchCapacity()
  }

  return {
    data,
    loading,
    error,
    refresh,
  }
}
