"use client"

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ListingFormData, createListing, updateListing, getListing } from './actions'
import { 
  debounce, 
  onboardingRateLimiter, 
  schoolCache,
  fetchWithRetry 
} from '@/lib/onboarding-optimization'

// Types (same as original)
export interface Listing {
  id?: string
  name: string
  domain: string
  logoUrl?: string | null
  address?: string | null
  phoneNumber?: string | null
  email?: string | null
  website?: string | null
  timezone?: string
  planType?: string
  maxStudents?: number
  maxTeachers?: number
  maxClasses?: number
  maxFacilities?: number
  isActive?: boolean
  schoolLevel?: 'primary' | 'secondary' | 'both'
  schoolType?: 'private' | 'public' | 'international' | 'technical' | 'special'
  tuitionFee?: number
  registrationFee?: number
  applicationFee?: number
  currency?: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD'
  paymentSchedule?: 'monthly' | 'quarterly' | 'semester' | 'annual'
  logo?: string
  primaryColor?: string
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  createdAt?: Date
  updatedAt?: Date
}

interface ListingContextType {
  listing: Listing | null
  isLoading: boolean
  error: string | null
  setListing: (listing: Listing | null) => void
  updateListingData: (data: Partial<ListingFormData>) => Promise<void>
  createNewListing: (data?: Partial<ListingFormData>) => Promise<string | null>
  loadListing: (id: string) => Promise<void>
  clearError: () => void
}

const ListingContext = createContext<ListingContextType | undefined>(undefined)

export function OptimizedListingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [listing, setListing] = useState<Listing | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Track the last loaded school ID to prevent redundant fetches
  const lastLoadedId = useRef<string | null>(null)
  const loadingPromise = useRef<Promise<void> | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Debounced update function to prevent rapid successive updates
  const debouncedUpdate = useRef(
    debounce(async (id: string, data: Partial<ListingFormData>) => {
      try {
        const result = await updateListing(id, data)
        if (!result.success && result.error) {
          setError(typeof result.error === 'string' ? result.error : 'Update failed')
        } else {
          // Clear cache for this school
          schoolCache.delete(`onboarding-${id}`)
        }
      } catch (err) {
        console.error('Update error:', err)
        setError('Failed to save changes')
      }
    }, 500) // 500ms debounce
  )

  const updateListingData = useCallback(async (data: Partial<ListingFormData>) => {
    if (!listing?.id) {
      setError('No listing to update')
      return
    }

    // Optimistically update the UI
    setListing(prev => prev ? { ...prev, ...data } : null)
    
    // Debounced server update
    debouncedUpdate.current(listing.id, data)
  }, [listing?.id])

  const createNewListing = useCallback(async (data?: Partial<ListingFormData>) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchWithRetry(() => createListing(data || {}))
      
      if (result.success && result.data) {
        const newListing: Listing = {
          id: result.data.id,
          name: result.data.name || 'New School',
          domain: result.data.domain || '',
          address: result.data.address,
          website: result.data.website,
          planType: result.data.planType,
          maxStudents: result.data.maxStudents,
          maxTeachers: result.data.maxTeachers,
          isActive: result.data.isActive,
          createdAt: result.data.createdAt,
          updatedAt: result.data.updatedAt,
        }
        
        setListing(newListing)
        return result.data.id
      } else {
        const errorMessage = typeof result.error === 'string' 
          ? result.error 
          : 'Failed to create listing'
        setError(errorMessage)
        return null
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create listing'
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadListing = useCallback(async (id: string) => {
    // Prevent duplicate loads
    if (lastLoadedId.current === id && listing?.id === id) {
      return
    }

    // If already loading this ID, wait for the existing promise
    if (loadingPromise.current) {
      return loadingPromise.current
    }

    // Check cache first
    const cacheKey = `listing-${id}`
    const cached = schoolCache.get(cacheKey)
    if (cached) {
      setListing(cached as Listing)
      lastLoadedId.current = id
      return
    }

    setIsLoading(true)
    setError(null)

    // Create a promise for this load operation
    loadingPromise.current = onboardingRateLimiter.throttle(
      `load-listing-${id}`,
      async () => {
        try {
          const result = await fetchWithRetry(() => getListing(id), 2, 500)
          
          if (result.success && result.data) {
            const loadedListing: Listing = {
              id: result.data.id,
              name: result.data.name || 'New School',
              domain: result.data.domain || '',
              address: result.data.address,
              phoneNumber: result.data.phoneNumber,
              email: result.data.email,
              website: result.data.website,
              timezone: result.data.timezone,
              planType: result.data.planType,
              maxStudents: result.data.maxStudents,
              maxTeachers: result.data.maxTeachers,
              isActive: result.data.isActive,
              createdAt: result.data.createdAt,
              updatedAt: result.data.updatedAt,
            }
            
            setListing(loadedListing)
            lastLoadedId.current = id
            
            // Cache the result
            schoolCache.set(cacheKey, loadedListing, 60) // Cache for 60 seconds
          } else {
            // Handle error
            let errorMessage = 'Failed to load listing'
            let isAccessDenied = false
            
            if (result.error) {
              if (typeof result.error === 'string') {
                errorMessage = result.error
                isAccessDenied = result.error.includes('Access denied') || 
                                result.error.includes('CROSS_TENANT_ACCESS_DENIED')
              } else if (typeof result.error === 'object' && result.error !== null) {
                const errorObj = result.error as any
                if ('message' in errorObj && typeof errorObj.message === 'string') {
                  errorMessage = errorObj.message
                  isAccessDenied = errorObj.message.includes('Access denied') || 
                                  errorObj.message.includes('CROSS_TENANT_ACCESS_DENIED')
                } else if ('code' in errorObj && typeof errorObj.code === 'string') {
                  errorMessage = `Error: ${errorObj.code}`
                  isAccessDenied = errorObj.code === 'CROSS_TENANT_ACCESS_DENIED'
                }
              }
            }
            
            if (result.code === 'CROSS_TENANT_ACCESS_DENIED') {
              isAccessDenied = true
            }
            
            if (isAccessDenied) {
              router.push('/join')
            } else {
              setError(errorMessage)
            }
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load listing'
          setError(errorMessage)
        } finally {
          setIsLoading(false)
          loadingPromise.current = null
        }
      }
    )

    return loadingPromise.current
  }, [listing?.id, router])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedUpdate.current.cancel?.()
    }
  }, [])

  const value: ListingContextType = {
    listing,
    isLoading,
    error,
    setListing,
    updateListingData,
    createNewListing,
    loadListing,
    clearError,
  }

  return (
    <ListingContext.Provider value={value}>
      {children}
    </ListingContext.Provider>
  )
}

export function useOptimizedListing() {
  const context = useContext(ListingContext)
  if (context === undefined) {
    throw new Error('useOptimizedListing must be used within an OptimizedListingProvider')
  }
  return context
}