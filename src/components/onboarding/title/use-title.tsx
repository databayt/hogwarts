"use client"

import { useEffect, useState } from "react"

import { getSchoolTitle } from "./actions"

export interface TitleFormData {
  title: string
  subdomain?: string
}

interface UseTitleReturn {
  data: TitleFormData | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useTitle(schoolId: string): UseTitleReturn {
  const [data, setData] = useState<TitleFormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTitle = async () => {
    if (!schoolId) return

    try {
      setLoading(true)
      setError(null)

      const result = await getSchoolTitle(schoolId)

      if (result.success && result.data) {
        setData(result.data)
      } else {
        setError(result.error || "Failed to load title")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTitle()
  }, [schoolId])

  return { data, loading, error, refresh: fetchTitle }
}
