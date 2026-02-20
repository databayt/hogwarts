"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { STEP_NAVIGATION } from "../config.client"
import { FloorPlanFormData, floorPlanSchema } from "../floor-plan/validation"
import { useHostNavigation, useListing } from "../use-listing"

export function useFloorPlan() {
  const { listing, updateListingData, isLoading, error } = useListing()
  const { goToNextStep, goToPreviousStep } = useHostNavigation("capacity")

  const form = useForm<FloorPlanFormData>({
    resolver: zodResolver(floorPlanSchema),
    defaultValues: {
      teachers: listing?.maxTeachers || 1,
      studentCount: listing?.maxStudents || 30,
    },
    mode: "onChange",
  })

  const onSubmit = async (data: FloorPlanFormData) => {
    try {
      console.log("School Capacity - Submitting:", data)

      await updateListingData({
        maxTeachers: data.teachers,
        maxStudents: data.studentCount,
      })

      const nextStep = STEP_NAVIGATION["capacity"].next
      if (nextStep) {
        goToNextStep(nextStep)
      }
    } catch (error) {
      console.error("Error submitting school capacity form:", error)
    }
  }

  const onBack = () => {
    const previousStep = STEP_NAVIGATION["capacity"].previous
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
    const newValue = Math.max(1, currentValue - 1)
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
    teachers: form.watch("teachers"),
    studentCount: form.watch("studentCount"),
  }
}
