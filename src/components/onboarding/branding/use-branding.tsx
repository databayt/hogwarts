"use client"

import { useEffect, useState } from "react"

import { getSchoolBranding } from "./actions"
import { type BrandingFormData } from "./validation"

interface UseBrandingReturn {
  data: BrandingFormData | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useBranding(schoolId: string): UseBrandingReturn {
  const [data, setData] = useState<BrandingFormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBranding = async () => {
    if (!schoolId) return

    try {
      setLoading(true)
      setError(null)
      const result = await getSchoolBranding(schoolId)

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || "Failed to fetch branding")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("Error fetching branding:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBranding()
  }, [schoolId])

  const refresh = async () => {
    await fetchBranding()
  }

  return {
    data,
    loading,
    error,
    refresh,
  }
}
