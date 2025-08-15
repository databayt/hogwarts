"use client"

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { aboutPlaceSchema, AboutPlaceFormData } from './validation'
import { useListing, useHostNavigation } from '../use-listing'
import { STEP_NAVIGATION } from '../constants'

export function useAboutPlace() {
  const { listing, updateListingData, isLoading, error } = useListing()
  const { goToNextStep } = useHostNavigation('about-place')

  const form = useForm<AboutPlaceFormData>({
    resolver: zodResolver(aboutPlaceSchema),
    defaultValues: {
      propertyType: listing?.propertyType || undefined,
    },
    mode: 'onChange',
  })

  const onSubmit = async (data: AboutPlaceFormData) => {
    try {
      console.log('🏠 About Place - Submitting:', data)
      
      // Update the listing with the property type
      await updateListingData({
        propertyType: data.propertyType,
      })

      // Navigate to next step
      const nextStep = STEP_NAVIGATION['about-place'].next
      if (nextStep) {
        goToNextStep(nextStep)
      }
    } catch (error) {
      console.error('❌ Error submitting about place form:', error)
    }
  }

  const isFormValid = form.formState.isValid
  const isDirty = form.formState.isDirty

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isLoading,
    error,
    isFormValid,
    isDirty,
    selectedPropertyType: form.watch('propertyType'),
  }
} 