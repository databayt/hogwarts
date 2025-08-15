"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ListingFormData, createListing, updateListing, getListing } from './actions'

// Types
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
  // School fields
  schoolLevel?: 'primary' | 'secondary' | 'both'
  schoolType?: 'private' | 'public' | 'international' | 'technical' | 'special'
  // Pricing fields
  tuitionFee?: number
  registrationFee?: number
  applicationFee?: number
  currency?: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD'
  paymentSchedule?: 'monthly' | 'quarterly' | 'semester' | 'annual'
  // Branding fields
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

// Provider component
interface ListingProviderProps {
  children: React.ReactNode
  initialListing?: Listing | null
}

export function ListingProvider({ children, initialListing = null }: ListingProviderProps) {
  const [listing, setListing] = useState<Listing | null>(initialListing)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const createNewListing = useCallback(async (data: Partial<ListingFormData> = {}) => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🎯 Creating new listing with data:', data)
      const result = await createListing({ draft: true, ...data })
      
      if (result.success && result.data) {
        const newListing: Listing = {
          id: result.data.id,
          name: result.data.name,
          domain: result.data.domain,
          logoUrl: result.data.logoUrl,
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
        
        setListing(newListing)
        console.log('✅ New listing created:', newListing.id)
        return newListing.id!
      }
      
      throw new Error('Failed to create listing')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('❌ Error creating listing:', errorMessage)
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadListing = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('📥 Loading listing:', id)
      const result = await getListing(id)
      
      if (result.success && result.data) {
        const loadedListing: Listing = {
          id: result.data.id,
          name: result.data.name,
          domain: result.data.domain,
          logoUrl: result.data.logoUrl,
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
        console.log('✅ Listing loaded successfully')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load listing'
      console.error('❌ Error loading listing:', errorMessage)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateListingData = useCallback(async (data: Partial<ListingFormData>) => {
    if (!listing?.id) {
      console.warn('⚠️ No listing ID available for update')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🔄 Updating listing:', listing.id, 'with data:', data)
      const result = await updateListing(listing.id, data)
      
      if (result.success && result.data) {
        const updatedListing: Listing = {
          id: result.data.id,
          name: result.data.name,
          domain: result.data.domain,
          logoUrl: result.data.logoUrl,
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
        
        setListing(updatedListing)
        console.log('✅ Listing updated successfully')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update listing'
      console.error('❌ Error updating listing:', errorMessage)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [listing?.id])

  const contextValue: ListingContextType = {
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
    <ListingContext.Provider value={contextValue}>
      {children}
    </ListingContext.Provider>
  )
}

// Hook to use the listing context
export function useListing() {
  const context = useContext(ListingContext)
  if (context === undefined) {
    throw new Error('useListing must be used within a ListingProvider')
  }
  return context
}

// Helper hook for navigation between steps
export function useHostNavigation(currentStep: string) {
  const router = useRouter()
  const { listing } = useListing()

  const goToStep = useCallback((step: string) => {
    if (!listing?.id) {
      console.warn('⚠️ No listing ID available for navigation')
      return
    }
    router.push(`/onboarding/${listing.id}/${step}`)
  }, [listing?.id, router])

  const goToNextStep = useCallback((nextStep: string) => {
    goToStep(nextStep)
  }, [goToStep])

  const goToPreviousStep = useCallback((previousStep: string) => {
    goToStep(previousStep)
  }, [goToStep])

  const goToOverview = useCallback(() => {
    router.push('/onboarding/overview')
  }, [router])

  return {
    goToStep,
    goToNextStep,
    goToPreviousStep,
    goToOverview,
    currentListingId: listing?.id,
  }
}