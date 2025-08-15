"use client"

import { useState } from 'react'
import { useListing, useHostNavigation } from '../use-listing'
import { publishListing } from '../actions'

export function useFinishSetup() {
  const { listing, isLoading: contextLoading, error: contextError } = useListing()
  const { goToOverview } = useHostNavigation('finish-setup')
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [isPublished, setIsPublished] = useState(false)

  const publishNow = async () => {
    if (!listing?.id) {
      setPublishError('No listing found to publish')
      return
    }

    setIsPublishing(true)
    setPublishError(null)

    try {
      console.log('🚀 Publishing listing:', listing.id)
      const result = await publishListing(listing.id)
      
      if (result.success) {
        console.log('✅ Listing published successfully')
        setIsPublished(true)
        
        // Navigate to overview after a short delay
        setTimeout(() => {
          goToOverview()
        }, 2000)
      } else {
        throw new Error('Failed to publish listing')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to publish listing'
      console.error('❌ Error publishing listing:', errorMessage)
      setPublishError(errorMessage)
    } finally {
      setIsPublishing(false)
    }
  }

  const saveDraft = () => {
    console.log('💾 Saving as draft')
    // Listing is already saved as draft, just navigate
    goToOverview()
  }

  const isLoading = contextLoading || isPublishing
  const error = contextError || publishError

  // Check if listing is ready to publish
  const canPublish = listing && 
    listing.title && 
    listing.description && 
    listing.pricePerNight && 
    listing.propertyType && 
    listing.bedrooms !== undefined && 
    listing.bathrooms !== undefined &&
    listing.address &&
    listing.city &&
    listing.state &&
    listing.country

  const missingRequirements = []
  if (!listing?.title) missingRequirements.push('Title')
  if (!listing?.description) missingRequirements.push('Description')
  if (!listing?.pricePerNight) missingRequirements.push('Price per night')
  if (!listing?.propertyType) missingRequirements.push('Property type')
  if (listing?.bedrooms === undefined) missingRequirements.push('Bedrooms')
  if (listing?.bathrooms === undefined) missingRequirements.push('Bathrooms')
  if (!listing?.address) missingRequirements.push('Address')
  if (!listing?.photoUrls || listing.photoUrls.length === 0) missingRequirements.push('Photos')

  return {
    listing,
    publishNow,
    saveDraft,
    isLoading,
    error,
    isPublished,
    canPublish,
    missingRequirements,
    isPublishing,
  }
} 