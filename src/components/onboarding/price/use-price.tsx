"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { STEP_NAVIGATION } from "../config.client"
import { useHostNavigation, useListing } from "../use-listing"
import { SchoolPriceFormData, schoolPriceSchema } from "./validation"

export function usePrice() {
  const { listing, updateListingData, isLoading, error } = useListing()
  const { goToNextStep, goToPreviousStep } = useHostNavigation("price")

  const form = useForm<SchoolPriceFormData>({
    resolver: zodResolver(schoolPriceSchema),
    defaultValues: {
      tuitionFee: 5000,
      registrationFee: 0,
      applicationFee: 0,
      currency: "USD" as const,
      paymentSchedule: "semester" as const,
    },
    mode: "onChange",
  })

  const onSubmit = async (data: SchoolPriceFormData) => {
    try {
      console.log("💰 Price - Submitting:", data)

      // Update the listing with the pricing data
      await updateListingData({
        tuitionFee: data.tuitionFee,
        registrationFee: data.registrationFee,
        applicationFee: data.applicationFee,
        currency: data.currency,
        paymentSchedule: data.paymentSchedule,
      })

      // Navigate to next step
      const nextStep = STEP_NAVIGATION["price"].next
      if (nextStep) {
        goToNextStep(nextStep)
      }
    } catch (error) {
      console.error("❌ Error submitting price form:", error)
    }
  }

  const onBack = () => {
    const previousStep = STEP_NAVIGATION["price"].previous
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
