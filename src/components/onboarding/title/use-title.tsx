"use client"

import { useEffect, useState } from "react"

import { testAction } from "./test-action"
import { type TitleFormData } from "./validation"

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

      // TEST: Call minimal test action to isolate the issue
      console.log("🧪 [USE TITLE] Calling testAction...")
      const testResult = await testAction()
      console.log("🧪 [USE TITLE] testAction result:", testResult)

      // Just return empty data for now
      setData({ title: "Test Title", subdomain: "" })
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
