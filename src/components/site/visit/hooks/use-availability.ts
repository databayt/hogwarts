"use client"

import { format, startOfMonth } from "date-fns"
import useSWR from "swr"

import { getAvailableDates, getAvailableSlots } from "../actions"

interface DayAvailability {
  date: string
  available: boolean
  slotsCount: number
}

interface TimeSlot {
  startTime: string
  endTime: string
  available: boolean
}

/**
 * Hook to fetch available dates for a month
 */
export function useAvailableDates(schoolId: string, month: Date) {
  const monthKey = format(startOfMonth(month), "yyyy-MM")

  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean
    dates?: DayAvailability[]
    error?: string
  }>(
    schoolId ? [`visit-dates`, schoolId, monthKey] : null,
    async () => {
      return getAvailableDates(schoolId, month)
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  )

  return {
    dates: data?.dates || [],
    isLoading,
    error: error || data?.error,
    refresh: mutate,
  }
}

/**
 * Hook to fetch available time slots for a specific date
 */
export function useAvailableSlots(schoolId: string, date: Date | null) {
  const dateKey = date ? format(date, "yyyy-MM-dd") : null

  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean
    slots?: TimeSlot[]
    error?: string
  }>(
    schoolId && dateKey ? [`visit-slots`, schoolId, dateKey] : null,
    async () => {
      if (!date) return { success: false, error: "No date selected" }
      return getAvailableSlots(schoolId, date)
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // Cache for 30 seconds
    }
  )

  return {
    slots: data?.slots || [],
    isLoading,
    error: error || data?.error,
    refresh: mutate,
  }
}
