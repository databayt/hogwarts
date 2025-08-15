"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { photosSchema, PhotosFormData } from './validation'
import { useListing, useHostNavigation } from '../use-listing'
import { STEP_NAVIGATION, FORM_LIMITS } from '../constants'

export function usePhotos() {
  const { listing, updateListingData, isLoading, error } = useListing()
  const { goToNextStep, goToPreviousStep } = useHostNavigation('photos')
  const [photoUrls, setPhotoUrls] = useState<string[]>(listing?.photoUrls || [])

  const form = useForm<PhotosFormData>({
    resolver: zodResolver(photosSchema),
    defaultValues: {
      photoUrls: listing?.photoUrls || [],
    },
    mode: 'onChange',
  })

  const addPhotoUrl = (url: string) => {
    if (photoUrls.length >= FORM_LIMITS.MAX_PHOTOS) return
    
    const newUrls = [...photoUrls, url]
    setPhotoUrls(newUrls)
    form.setValue('photoUrls', newUrls, { shouldValidate: true })
  }

  const removePhoto = (index: number) => {
    const newUrls = photoUrls.filter((_, i) => i !== index)
    setPhotoUrls(newUrls)
    form.setValue('photoUrls', newUrls, { shouldValidate: true })
  }

  const onSubmit = async (data: PhotosFormData) => {
    try {
      console.log('📸 Photos - Submitting:', data)
      
      // Update the listing with the photo URLs
      await updateListingData({
        photoUrls: data.photoUrls,
      })

      // Navigate to next step
      const nextStep = STEP_NAVIGATION['photos'].next
      if (nextStep) {
        goToNextStep(nextStep)
      }
    } catch (error) {
      console.error('❌ Error submitting photos form:', error)
    }
  }

  const onBack = () => {
    const previousStep = STEP_NAVIGATION['photos'].previous
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
    photoUrls,
    addPhotoUrl,
    removePhoto,
    isLoading,
    error,
    isFormValid,
    isDirty,
  }
} 