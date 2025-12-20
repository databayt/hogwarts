"use client"

import { useEffect, useState } from "react"

// TEMPORARILY: Import from test-action.ts to isolate the issue
// import { getSchoolTitle, type TitleFormData } from "./actions"
import { testGetSchoolTitle } from "../test-action"

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

      console.log("🔍 [USE TITLE] Fetching school title for:", schoolId)
      // TEMPORARILY: Use test action from test-action.ts
      const result = await testGetSchoolTitle(schoolId)
      console.log("🔍 [USE TITLE] Result:", result)

      if (result.success && result.data) {
        setData(result.data)
      } else {
        setError((result as any).error || "Failed to load title")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("Error fetching title:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTitle()
  }, [schoolId])

  const refresh = async () => {
    await fetchTitle()
  }

  return {
    data,
    loading,
    error,
    refresh,
  }
}
