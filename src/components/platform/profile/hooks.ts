/**
 * Profile System Custom Hooks
 * React hooks for managing profile data and state
 */

"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import useSWR, { mutate } from 'swr'
import type {
  BaseProfile,
  StudentProfile,
  TeacherProfile,
  ParentProfile,
  StaffProfile,
  UserProfileType,
  ProfilePermissions,
  ConnectionStatus,
  ActivityItem,
  ContributionData,
  ProfileSearchParams,
  ProfileResponse
} from './types'

// ============================================================================
// API Fetchers
// ============================================================================

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch')
  }
  return response.json()
}

// ============================================================================
// Main Profile Hook
// ============================================================================

interface UseProfileOptions {
  userId?: string
  profileType?: UserProfileType
  includeActivities?: boolean
  includeContributions?: boolean
  includeConnections?: boolean
  refreshInterval?: number
}

interface UseProfileReturn<T = BaseProfile> {
  profile: T | null
  isLoading: boolean
  isError: boolean
  error: Error | null
  refresh: () => Promise<void>
  updateProfile: (updates: Partial<T>) => Promise<void>
  permissions: ProfilePermissions | null
}

/**
 * Hook to fetch and manage a user profile
 */
export function useProfile<T extends BaseProfile = BaseProfile>({
  userId,
  profileType,
  includeActivities = true,
  includeContributions = true,
  includeConnections = false,
  refreshInterval = 0
}: UseProfileOptions = {}): UseProfileReturn<T> {
  const queryParams = new URLSearchParams()
  if (profileType) queryParams.append('type', profileType)
  if (includeActivities) queryParams.append('includeActivities', 'true')
  if (includeContributions) queryParams.append('includeContributions', 'true')
  if (includeConnections) queryParams.append('includeConnections', 'true')

  const url = userId
    ? `/api/profile/${userId}?${queryParams.toString()}`
    : `/api/profile/current?${queryParams.toString()}`

  const { data, error, mutate: swrMutate } = useSWR<ProfileResponse<T>>(
    url,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  )

  const [permissions, setPermissions] = useState<ProfilePermissions | null>(null)

  // Fetch permissions
  useEffect(() => {
    if (data?.data) {
      fetch(`/api/profile/${data.data.id}/permissions`)
        .then(res => res.json())
        .then(setPermissions)
        .catch(console.error)
    }
  }, [data])

  const refresh = useCallback(async () => {
    await swrMutate()
  }, [swrMutate])

  const updateProfile = useCallback(async (updates: Partial<T>) => {
    try {
      const response = await fetch(url.replace('?', '/update?'), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      // Refresh the profile data
      await swrMutate()
    } catch (error) {
      console.error('Profile update failed:', error)
      throw error
    }
  }, [url, swrMutate])

  return {
    profile: data?.data || null,
    isLoading: !error && !data,
    isError: !!error,
    error,
    refresh,
    updateProfile,
    permissions
  }
}

// ============================================================================
// Profile Activity Hook
// ============================================================================

interface UseProfileActivityOptions {
  userId?: string
  limit?: number
  offset?: number
  type?: ActivityItem['type'] | 'all'
  refreshInterval?: number
}

interface UseProfileActivityReturn {
  activities: ActivityItem[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  hasMore: boolean
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
}

/**
 * Hook to fetch and manage profile activities
 */
export function useProfileActivity({
  userId,
  limit = 20,
  offset = 0,
  type = 'all',
  refreshInterval = 30000 // 30 seconds
}: UseProfileActivityOptions = {}): UseProfileActivityReturn {
  const [allActivities, setAllActivities] = useState<ActivityItem[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [currentOffset, setCurrentOffset] = useState(offset)

  const queryParams = new URLSearchParams()
  queryParams.append('limit', limit.toString())
  queryParams.append('offset', currentOffset.toString())
  if (type !== 'all') queryParams.append('type', type)

  const url = userId
    ? `/api/profile/${userId}/activity?${queryParams.toString()}`
    : `/api/profile/current/activity?${queryParams.toString()}`

  const { data, error, mutate: swrMutate } = useSWR<{
    activities: ActivityItem[]
    hasMore: boolean
  }>(url, fetcher, {
    refreshInterval,
    revalidateOnFocus: false
  })

  useEffect(() => {
    if (data) {
      if (currentOffset === 0) {
        setAllActivities(data.activities)
      } else {
        setAllActivities(prev => [...prev, ...data.activities])
      }
      setHasMore(data.hasMore)
    }
  }, [data, currentOffset])

  const loadMore = useCallback(async () => {
    if (!hasMore) return
    setCurrentOffset(prev => prev + limit)
  }, [hasMore, limit])

  const refresh = useCallback(async () => {
    setCurrentOffset(0)
    await swrMutate()
  }, [swrMutate])

  return {
    activities: allActivities,
    isLoading: !error && !data,
    isError: !!error,
    error,
    hasMore,
    loadMore,
    refresh
  }
}

// ============================================================================
// Profile Contributions Hook
// ============================================================================

interface UseProfileContributionsOptions {
  userId?: string
  year?: number
  refreshInterval?: number
}

interface UseProfileContributionsReturn {
  contributions: ContributionData | null
  isLoading: boolean
  isError: boolean
  error: Error | null
  refresh: () => Promise<void>
}

/**
 * Hook to fetch and manage profile contribution data
 */
export function useProfileContributions({
  userId,
  year = new Date().getFullYear(),
  refreshInterval = 60000 // 1 minute
}: UseProfileContributionsOptions = {}): UseProfileContributionsReturn {
  const url = userId
    ? `/api/profile/${userId}/contributions?year=${year}`
    : `/api/profile/current/contributions?year=${year}`

  const { data, error, mutate: swrMutate } = useSWR<ContributionData>(
    url,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: false
    }
  )

  const refresh = useCallback(async () => {
    await swrMutate()
  }, [swrMutate])

  return {
    contributions: data || null,
    isLoading: !error && !data,
    isError: !!error,
    error,
    refresh
  }
}

// ============================================================================
// Profile Connections Hook
// ============================================================================

interface UseProfileConnectionsOptions {
  userId?: string
  limit?: number
  offset?: number
  refreshInterval?: number
}

interface Connection {
  id: string
  userId: string
  displayName: string
  avatar?: string | null
  profileType: UserProfileType
  connectedAt: Date
  status: ConnectionStatus
}

interface UseProfileConnectionsReturn {
  connections: Connection[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  totalConnections: number
  refresh: () => Promise<void>
  connect: (targetUserId: string, message?: string) => Promise<void>
  disconnect: (targetUserId: string) => Promise<void>
  acceptRequest: (requestId: string) => Promise<void>
  rejectRequest: (requestId: string) => Promise<void>
}

/**
 * Hook to manage profile connections
 */
export function useProfileConnections({
  userId,
  limit = 20,
  offset = 0,
  refreshInterval = 0
}: UseProfileConnectionsOptions = {}): UseProfileConnectionsReturn {
  const queryParams = new URLSearchParams()
  queryParams.append('limit', limit.toString())
  queryParams.append('offset', offset.toString())

  const url = userId
    ? `/api/profile/${userId}/connections?${queryParams.toString()}`
    : `/api/profile/current/connections?${queryParams.toString()}`

  const { data, error, mutate: swrMutate } = useSWR<{
    connections: Connection[]
    total: number
  }>(url, fetcher, {
    refreshInterval,
    revalidateOnFocus: true
  })

  const connect = useCallback(async (targetUserId: string, message?: string) => {
    try {
      const response = await fetch('/api/connections/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetUserId, message })
      })

      if (!response.ok) {
        throw new Error('Failed to send connection request')
      }

      await swrMutate()
    } catch (error) {
      console.error('Connection request failed:', error)
      throw error
    }
  }, [swrMutate])

  const disconnect = useCallback(async (targetUserId: string) => {
    try {
      const response = await fetch(`/api/connections/${targetUserId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect')
      }

      await swrMutate()
    } catch (error) {
      console.error('Disconnect failed:', error)
      throw error
    }
  }, [swrMutate])

  const acceptRequest = useCallback(async (requestId: string) => {
    try {
      const response = await fetch(`/api/connections/request/${requestId}/accept`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to accept request')
      }

      await swrMutate()
    } catch (error) {
      console.error('Accept request failed:', error)
      throw error
    }
  }, [swrMutate])

  const rejectRequest = useCallback(async (requestId: string) => {
    try {
      const response = await fetch(`/api/connections/request/${requestId}/reject`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to reject request')
      }

      await swrMutate()
    } catch (error) {
      console.error('Reject request failed:', error)
      throw error
    }
  }, [swrMutate])

  const refresh = useCallback(async () => {
    await swrMutate()
  }, [swrMutate])

  return {
    connections: data?.connections || [],
    isLoading: !error && !data,
    isError: !!error,
    error,
    totalConnections: data?.total || 0,
    refresh,
    connect,
    disconnect,
    acceptRequest,
    rejectRequest
  }
}

// ============================================================================
// Profile Search Hook
// ============================================================================

interface UseProfileSearchReturn {
  results: BaseProfile[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  totalResults: number
  search: (params: ProfileSearchParams) => Promise<void>
  clearResults: () => void
}

/**
 * Hook to search for profiles
 */
export function useProfileSearch(): UseProfileSearchReturn {
  const [searchParams, setSearchParams] = useState<ProfileSearchParams | null>(null)
  const [results, setResults] = useState<BaseProfile[]>([])
  const [totalResults, setTotalResults] = useState(0)

  const queryParams = searchParams
    ? new URLSearchParams(searchParams as any).toString()
    : null

  const url = queryParams ? `/api/profile/search?${queryParams}` : null

  const { data, error } = useSWR<{
    profiles: BaseProfile[]
    total: number
  }>(url, fetcher)

  useEffect(() => {
    if (data) {
      setResults(data.profiles)
      setTotalResults(data.total)
    }
  }, [data])

  const search = useCallback(async (params: ProfileSearchParams) => {
    setSearchParams(params)
  }, [])

  const clearResults = useCallback(() => {
    setSearchParams(null)
    setResults([])
    setTotalResults(0)
  }, [])

  return {
    results,
    isLoading: !!searchParams && !error && !data,
    isError: !!error,
    error,
    totalResults,
    search,
    clearResults
  }
}

// ============================================================================
// Profile Theme Hook
// ============================================================================

interface UseProfileThemeReturn {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  resolvedTheme: 'light' | 'dark'
}

/**
 * Hook to manage profile theme preferences
 */
export function useProfileTheme(): UseProfileThemeReturn {
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Get saved theme from localStorage
    const savedTheme = localStorage.getItem('profileTheme') as typeof theme
    if (savedTheme) {
      setThemeState(savedTheme)
    }

    // Resolve system theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light')

      const handler = (e: MediaQueryListEvent) => {
        setResolvedTheme(e.matches ? 'dark' : 'light')
      }

      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    } else {
      setResolvedTheme(theme)
    }
  }, [theme])

  const setTheme = useCallback((newTheme: typeof theme) => {
    setThemeState(newTheme)
    localStorage.setItem('profileTheme', newTheme)

    // Update profile settings via API
    fetch('/api/profile/current/settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ theme: newTheme })
    }).catch(console.error)
  }, [])

  return {
    theme,
    setTheme,
    resolvedTheme
  }
}

// ============================================================================
// Profile Notifications Hook
// ============================================================================

interface Notification {
  id: string
  type: string
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
}

interface UseProfileNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  isError: boolean
  error: Error | null
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  refresh: () => Promise<void>
}

/**
 * Hook to manage profile notifications
 */
export function useProfileNotifications(): UseProfileNotificationsReturn {
  const { data, error, mutate: swrMutate } = useSWR<{
    notifications: Notification[]
    unreadCount: number
  }>('/api/profile/current/notifications', fetcher, {
    refreshInterval: 30000, // 30 seconds
    revalidateOnFocus: true
  })

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      })
      await swrMutate()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      throw error
    }
  }, [swrMutate])

  const markAllAsRead = useCallback(async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST'
      })
      await swrMutate()
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      throw error
    }
  }, [swrMutate])

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })
      await swrMutate()
    } catch (error) {
      console.error('Failed to delete notification:', error)
      throw error
    }
  }, [swrMutate])

  const refresh = useCallback(async () => {
    await swrMutate()
  }, [swrMutate])

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    isLoading: !error && !data,
    isError: !!error,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh
  }
}