"use client"

import { useEffect, useState } from "react"

import { getSchoolCapacity } from "./actions"
import { type CapacityFormData } from "./validation"

interface UseCapacityReturn {
  data: CapacityFormData | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useCapacity(schoolId: string): UseCapacityReturn {
  const [data, setData] = useState<CapacityFormData | null>(null)
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
