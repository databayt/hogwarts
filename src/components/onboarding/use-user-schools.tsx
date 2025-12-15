"use client"

import { useEffect, useState } from "react"

import { getUserSchools } from "./actions"

interface School {
  id: string
  name: string
  domain: string
  createdAt: Date
  updatedAt: Date
  maxStudents?: number
  maxTeachers?: number
  planType?: string
  address?: string
  website?: string
}

interface UseUserSchoolsReturn {
  schools: School[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useUserSchools(): UseUserSchoolsReturn {
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserSchools = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getUserSchools()

      if (result.success) {
        setSchools(result.data || [])
      } else {
        setError(result.error || "Failed to fetch schools")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("Error fetching user schools:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserSchools()
  }, [])

  const refresh = async () => {
    await fetchUserSchools()
  }

  return {
    schools,
    loading,
    error,
    refresh,
  }
}

// Helper function to determine setup completion status
export function getSchoolSetupStatus(school: School) {
  const hasBasicInfo = school.name && school.name !== "New School"
  const hasDescription = school.planType?.includes("-")
  const hasLocation = !!school.address
  const hasPricing = school.website?.startsWith("pricing-set-")

  const completedSteps = [
    hasBasicInfo,
    hasDescription,
    hasLocation,
    hasPricing,
  ].filter(Boolean).length
  const totalSteps = 4
  const completionPercentage = Math.round((completedSteps / totalSteps) * 100)

  return {
    completionPercentage,
    completedSteps,
    totalSteps,
    isComplete: completionPercentage === 100,
    nextStep: hasBasicInfo
      ? hasDescription
        ? hasLocation
          ? "pricing"
          : "location"
        : "description"
      : "title",
  }
}
