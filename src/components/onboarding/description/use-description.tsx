"use client"

import { useState, useEffect } from 'react'
import { getSchoolDescription } from './actions'
import { type DescriptionFormData } from './validation'

interface UseDescriptionReturn {
  data: DescriptionFormData | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useDescription(schoolId: string): UseDescriptionReturn {
  const [data, setData] = useState<DescriptionFormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDescription = async () => {
    if (!schoolId) return
    
    try {
      setLoading(true)
      setError(null)
      const result = await getSchoolDescription(schoolId)
      
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Failed to fetch description')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Error fetching description:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDescription()
  }, [schoolId])

  const refresh = async () => {
    await fetchDescription()
  }

  return {
    data,
    loading,
    error,
    refresh
  }
} 