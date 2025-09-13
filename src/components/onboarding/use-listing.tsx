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
        return newListing.id!
      }
      
      throw new Error('Failed to create listing')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadListing = useCallback(async (id: string, retryCount = 0) => {
    
    setIsLoading(true)
    setError(null)
    
    try {
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
      } else {
        
        // Extract error message from result.error
        let errorMessage = 'Failed to load listing';
        let isAccessDenied = false;
        
        if (result.error) {
          
          if (typeof result.error === 'string') {
            errorMessage = result.error;
            isAccessDenied = result.error.includes('Access denied') || result.error.includes('CROSS_TENANT_ACCESS_DENIED');
          } else if (typeof result.error === 'object' && result.error !== null) {
            const errorObj = result.error as any; // Type assertion to handle the object case
            if ('message' in errorObj && typeof errorObj.message === 'string') {
              errorMessage = errorObj.message;
              isAccessDenied = errorObj.message.includes('Access denied') || errorObj.message.includes('CROSS_TENANT_ACCESS_DENIED');
            } else if ('code' in errorObj && typeof errorObj.code === 'string') {
              errorMessage = `Error: ${errorObj.code}`;
              isAccessDenied = errorObj.code === 'CROSS_TENANT_ACCESS_DENIED';
            }
            
            // Check for code field separately
            if ('code' in errorObj && errorObj.code === 'CROSS_TENANT_ACCESS_DENIED') {
              isAccessDenied = true;
            }
          }
        }
        
        // Also check the result.code field directly
        if (result.code === 'CROSS_TENANT_ACCESS_DENIED') {
          isAccessDenied = true;
          errorMessage = 'Access denied to this school';
        }
        
        // Fallback: If error is empty object and we're in onboarding, assume it's an access denied issue
        if (!result.success && (!result.error || (typeof result.error === 'object' && Object.keys(result.error).length === 0))) {
          isAccessDenied = true;
          errorMessage = 'Access denied to this school';
        }
        
        
               // Handle access denied error during onboarding with exponential backoff
       if (isAccessDenied && retryCount < 3) { // Increase retry count to 3
         const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // 1s, 2s, 4s, max 5s
         
         setTimeout(() => {
           loadListing(id, retryCount + 1);
         }, delay);
         return;
       }
       
       // If we've exhausted retries and it's still an access denied error, show specific message
       if (retryCount >= 3 && isAccessDenied) {
         setError('Unable to access this school. This might be because you\'re trying to access a different school than the one you created. Please go back to the overview and try again.');
       } else {
         // For non-access-denied errors or if retries aren't applicable
         setError(errorMessage || 'Failed to load school information');
       }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load listing'
      
      // Handle access denied error during onboarding with exponential backoff
      if (errorMessage.includes('Access denied to this school') && retryCount < 2) {
        // Check if this might be a schoolId mismatch issue
        if (retryCount === 0) {
          // For the first retry, try to get the user's current school from the session
          try {
            // Import the auth hook to get current user info
            const { useCurrentUser } = await import('@/components/auth/use-current-user');
            // Note: This won't work in a callback, but we can at least log the attempt
          } catch (err) {
          }
        }
        
        const delay = Math.min(1000 * Math.pow(2, retryCount), 4000); // 1s, 2s, max 4s
        
        setTimeout(() => {
          loadListing(id, retryCount + 1);
        }, delay);
        return;
      }
      
      // If we've exhausted retries or it's a different error, show the error
      if (retryCount >= 2 && errorMessage.includes('Access denied to this school')) {
        // Provide more specific error message for schoolId mismatch
        setError('Unable to access this school. This might be because you\'re trying to access a different school than the one you created. Please go back to the overview and try again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateListingData = useCallback(async (data: Partial<ListingFormData>) => {
    if (!listing?.id) {
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
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
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update listing'
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