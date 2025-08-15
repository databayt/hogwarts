"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ListingFormData, createListing, updateListing, getListing } from './actions'

// Types
export interface Listing extends ListingFormData {
  id?: number
  createdAt?: Date
  updatedAt?: Date
  postedDate?: Date | null
}

interface ListingContextType {
  listing: Listing | null
  isLoading: boolean
  error: string | null
  setListing: (listing: Listing | null) => void
  updateListingData: (data: Partial<ListingFormData>) => Promise<void>
  createNewListing: (data?: Partial<ListingFormData>) => Promise<number | null>
  loadListing: (id: number) => Promise<void>
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
      
      if (result.success && result.listing) {
        const newListing: Listing = {
          id: result.listing.id,
          title: result.listing.title,
          description: result.listing.description,
          pricePerNight: result.listing.pricePerNight,
          securityDeposit: result.listing.securityDeposit,
          applicationFee: result.listing.applicationFee,
          bedrooms: result.listing.bedrooms,
          bathrooms: result.listing.bathrooms,
          squareFeet: result.listing.squareFeet,
          guestCount: result.listing.guestCount,
          propertyType: result.listing.propertyType,
          isPetsAllowed: result.listing.isPetsAllowed,
          isParkingIncluded: result.listing.isParkingIncluded,
          instantBook: result.listing.instantBook,
          amenities: result.listing.amenities,
          highlights: result.listing.highlights,
          photoUrls: result.listing.photoUrls,
          draft: result.listing.draft,
          isPublished: result.listing.isPublished,
          // Location data
          address: result.listing.location?.address,
          city: result.listing.location?.city,
          state: result.listing.location?.state,
          country: result.listing.location?.country,
          postalCode: result.listing.location?.postalCode,
          latitude: result.listing.location?.latitude,
          longitude: result.listing.location?.longitude,
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

  const loadListing = useCallback(async (id: number) => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('📥 Loading listing:', id)
      const result = await getListing(id)
      
      const loadedListing: Listing = {
        id: result.id,
        title: result.title,
        description: result.description,
        pricePerNight: result.pricePerNight,
        securityDeposit: result.securityDeposit,
        applicationFee: result.applicationFee,
        bedrooms: result.bedrooms,
        bathrooms: result.bathrooms,
        squareFeet: result.squareFeet,
        guestCount: result.guestCount,
        propertyType: result.propertyType,
        isPetsAllowed: result.isPetsAllowed,
        isParkingIncluded: result.isParkingIncluded,
        instantBook: result.instantBook,
        amenities: result.amenities,
        highlights: result.highlights,
        photoUrls: result.photoUrls,
        draft: result.draft,
        isPublished: result.isPublished,
        // Location data
        address: result.location?.address,
        city: result.location?.city,
        state: result.location?.state,
        country: result.location?.country,
        postalCode: result.location?.postalCode,
        latitude: result.location?.latitude,
        longitude: result.location?.longitude,
      }
      
      setListing(loadedListing)
      console.log('✅ Listing loaded successfully')
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
      
      if (result.success && result.listing) {
        const updatedListing: Listing = {
          id: result.listing.id,
          title: result.listing.title,
          description: result.listing.description,
          pricePerNight: result.listing.pricePerNight,
          securityDeposit: result.listing.securityDeposit,
          applicationFee: result.listing.applicationFee,
          bedrooms: result.listing.bedrooms,
          bathrooms: result.listing.bathrooms,
          squareFeet: result.listing.squareFeet,
          guestCount: result.listing.guestCount,
          propertyType: result.listing.propertyType,
          isPetsAllowed: result.listing.isPetsAllowed,
          isParkingIncluded: result.listing.isParkingIncluded,
          instantBook: result.listing.instantBook,
          amenities: result.listing.amenities,
          highlights: result.listing.highlights,
          photoUrls: result.listing.photoUrls,
          draft: result.listing.draft,
          isPublished: result.listing.isPublished,
          // Location data
          address: result.listing.location?.address,
          city: result.listing.location?.city,
          state: result.listing.location?.state,
          country: result.listing.location?.country,
          postalCode: result.listing.location?.postalCode,
          latitude: result.listing.location?.latitude,
          longitude: result.listing.location?.longitude,
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
    router.push(`/host/${listing.id}/${step}`)
  }, [listing?.id, router])

  const goToNextStep = useCallback((nextStep: string) => {
    goToStep(nextStep)
  }, [goToStep])

  const goToPreviousStep = useCallback((previousStep: string) => {
    goToStep(previousStep)
  }, [goToStep])

  const goToOverview = useCallback(() => {
    router.push('/host/overview')
  }, [router])

  return {
    goToStep,
    goToNextStep,
    goToPreviousStep,
    goToOverview,
    currentListingId: listing?.id,
  }
} 