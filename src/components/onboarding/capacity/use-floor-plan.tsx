"use client"

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { floorPlanSchema, FloorPlanFormData } from '../floor-plan/validation'
import { useListing, useHostNavigation } from '../use-listing'
import { STEP_NAVIGATION } from "../config"

export function useFloorPlan() {
  const { listing, updateListingData, isLoading, error } = useListing()
  const { goToNextStep, goToPreviousStep } = useHostNavigation('floor-plan')

  const form = useForm<FloorPlanFormData>({
    resolver: zodResolver(floorPlanSchema),
    defaultValues: {
      teachers: listing?.maxTeachers || 1,
      facilities: listing?.maxFacilities || 1,
      studentCount: listing?.maxStudents || 30,
    },
    mode: 'onChange',
  })

  const onSubmit = async (data: FloorPlanFormData) => {
    try {
      console.log('🏫 School Capacity - Submitting:', data)
      
      // Update the listing with the school capacity data
      await updateListingData({
        maxTeachers: data.teachers,
        maxFacilities: data.facilities,
        maxStudents: data.studentCount,
      })

      // Navigate to next step
      const nextStep = STEP_NAVIGATION['floor-plan'].next
      if (nextStep) {
        goToNextStep(nextStep)
      }
    } catch (error) {
      console.error('❌ Error submitting school capacity form:', error)
    }
  }

  const onBack = () => {
    const previousStep = STEP_NAVIGATION['floor-plan'].previous
    if (previousStep) {
      goToPreviousStep(previousStep)
    }
  }

  const increment = (field: keyof FloorPlanFormData) => {
    const currentValue = form.getValues(field)
    form.setValue(field, currentValue + 1, { shouldValidate: true })
  }

  const decrement = (field: keyof FloorPlanFormData) => {
    const currentValue = form.getValues(field)
    const minValue = field === 'studentCount' ? 1 : 1
    const newValue = Math.max(minValue, currentValue - 1)
    form.setValue(field, newValue, { shouldValidate: true })
  }

  const isFormValid = form.formState.isValid
  const isDirty = form.formState.isDirty

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    onBack,
    increment,
    decrement,
    isLoading,
    error,
    isFormValid,
    isDirty,
    teachers: form.watch('teachers'),
    facilities: form.watch('facilities'),
    studentCount: form.watch('studentCount'),
  }
}