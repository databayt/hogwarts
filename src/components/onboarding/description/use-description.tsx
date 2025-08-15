"use client"

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { descriptionSchema, DescriptionFormData } from './validation'
import { useListing, useHostNavigation } from '../use-listing'
import { STEP_NAVIGATION, FORM_LIMITS } from '../constants'

export function useDescription() {
  const { listing, updateListingData, isLoading, error } = useListing()
  const { goToNextStep, goToPreviousStep } = useHostNavigation('description')

  const form = useForm<DescriptionFormData>({
    resolver: zodResolver(descriptionSchema),
    defaultValues: {
      schoolLevel: listing?.schoolLevel || 'primary',
      schoolType: listing?.schoolType || 'private',
    },
    mode: 'onChange',
  })

  const schoolLevel = form.watch('schoolLevel')
  const schoolType = form.watch('schoolType')

  const onSubmit = async (data: DescriptionFormData) => {
    try {
      console.log('📝 Description - Submitting:', data)
      
      // Update the listing with the description
      await updateListingData({
        schoolLevel: data.schoolLevel,
        schoolType: data.schoolType,
      })

      // Navigate to next step
      const nextStep = STEP_NAVIGATION['description'].next
      if (nextStep) {
        goToNextStep(nextStep)
      }
    } catch (error) {
      console.error('❌ Error submitting description form:', error)
    }
  }

  const onBack = () => {
    const previousStep = STEP_NAVIGATION['description'].previous
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
    schoolLevel,
    schoolType,
  }
} 