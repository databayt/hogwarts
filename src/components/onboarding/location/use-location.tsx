"use client"

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { locationSchema, LocationFormData } from './validation'
import { useListing, useHostNavigation } from '../use-listing'
import { STEP_NAVIGATION } from '../constants.client'

export function useLocation() {
  const { listing, updateListingData, isLoading, error } = useListing()
  const { goToNextStep, goToPreviousStep } = useHostNavigation('location')

  const form = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      address: listing?.address || '',
    },
    mode: 'onChange',
  })

  const onSubmit = async (data: LocationFormData) => {
    try {
      console.log('📍 Location - Submitting:', data)
      
      // Update the listing with the location data
      await updateListingData({
        address: data.address,
      })

      // Navigate to next step
      const nextStep = STEP_NAVIGATION['location'].next
      if (nextStep) {
        goToNextStep(nextStep)
      }
    } catch (error) {
      console.error('❌ Error submitting location form:', error)
    }
  }

  const onBack = () => {
    const previousStep = STEP_NAVIGATION['location'].previous
    if (previousStep) {
      goToPreviousStep(previousStep)
    }
  }

  const isFormValid = form.formState.isValid
  const isDirty = form.formState.isDirty

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    onBack,
    isLoading,
    error,
    isFormValid,
    isDirty,
  }
} 