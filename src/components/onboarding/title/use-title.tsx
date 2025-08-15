"use client"

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { titleSchema, TitleFormData } from './validation'
import { useListing, useHostNavigation } from '../use-listing'
import { STEP_NAVIGATION, FORM_LIMITS } from '../constants'

export function useTitle() {
  const { listing, updateListingData, isLoading, error } = useListing()
  const { goToNextStep, goToPreviousStep } = useHostNavigation('title')

  const form = useForm<TitleFormData>({
    resolver: zodResolver(titleSchema),
    defaultValues: {
      title: listing?.name || '',
    },
    mode: 'onChange',
  })

  const title = form.watch('title')
  const characterCount = title?.length || 0
  const remainingCharacters = FORM_LIMITS.TITLE_MAX_LENGTH - characterCount

  const onSubmit = async (data: TitleFormData) => {
    try {
      console.log('📝 Title - Submitting:', data)
      
      // Update the listing with the title
      await updateListingData({
        title: data.title,
      })

      // Navigate to next step
      const nextStep = STEP_NAVIGATION['title'].next
      if (nextStep) {
        goToNextStep(nextStep)
      }
    } catch (error) {
      console.error('❌ Error submitting title form:', error)
    }
  }

  const onBack = () => {
    const previousStep = STEP_NAVIGATION['title'].previous
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
    title,
    characterCount,
    remainingCharacters,
  }
} 