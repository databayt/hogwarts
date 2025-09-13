"use client"

import { useState, useEffect } from 'react'
import { getSchoolLocation } from './actions'
import { type LocationFormData } from './validation'

interface UseLocationReturn {
  data: LocationFormData | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useLocation(schoolId: string): UseLocationReturn {
  const [data, setData] = useState<LocationFormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLocation = async () => {
    if (!schoolId) {
      setError('School ID is missing')
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      const result = await getSchoolLocation(schoolId)
      
      if (result.success && result.data) {
        setData(result.data)
      } else if (result.success && !result.data) {
        // No location data yet, that's okay
        setData(null)
      } else {
        setError(result.error || 'Failed to fetch location')
        console.error('Location fetch error:', result.error)
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'An unexpected error occurred'
      setError(errorMessage)
      console.error('Error fetching location:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLocation()
  }, [schoolId])

  const refresh = async () => {
    await fetchLocation()
  }

  return {
    data,
    loading,
    error,
    refresh
  }
} 