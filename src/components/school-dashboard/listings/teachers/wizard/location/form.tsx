"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useImperativeHandle, useTransition } from "react"
import dynamic from "next/dynamic"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { type LocationResult } from "@/lib/mapbox"
import { Form } from "@/components/ui/form"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorToast } from "@/components/atom/toast"
import { InputField, TextareaField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"

import { updateTeacherLocation } from "./actions"
import { locationSchema, type LocationFormData } from "./validation"

const MapboxLocationPicker = dynamic(
  () =>
    import("@/components/atom/mapbox-location-picker").then(
      (mod) => mod.MapboxLocationPicker
    ),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-[320px] w-full rounded-xl" />
      </div>
    ),
  }
)

interface LocationFormProps {
  teacherId: string
  initialData?: Partial<LocationFormData>
  onValidChange?: (isValid: boolean) => void
}

export const LocationForm = forwardRef<WizardFormRef, LocationFormProps>(
  ({ teacherId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()
    const hasMapbox = !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN

    const form = useForm<LocationFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(locationSchema) as any,
      defaultValues: {
        currentAddress: initialData?.currentAddress || "",
        city: initialData?.city || "",
        state: initialData?.state || "",
        postalCode: initialData?.postalCode || "",
        country: initialData?.country || "",
      },
    })

    // Location step is always valid (all fields optional)
    React.useEffect(() => {
      onValidChange?.(true)
    }, [onValidChange])

    useImperativeHandle(ref, () => ({
      saveAndNext: () =>
        new Promise<void>((resolve, reject) => {
          startTransition(async () => {
            try {
              const valid = await form.trigger()
              if (!valid) {
                reject(new Error("Validation failed"))
                return
              }
              const data = form.getValues()
              const result = await updateTeacherLocation(teacherId, data)
              if (!result.success) {
                ErrorToast(result.error || "Failed to save")
                reject(new Error(result.error))
                return
              }
              resolve()
            } catch (err) {
              const msg = err instanceof Error ? err.message : "Failed to save"
              ErrorToast(msg)
              reject(err)
            }
          })
        }),
    }))

    const handleLocationChange = (result: LocationResult) => {
      form.setValue("currentAddress", result.address)
      form.setValue("city", result.city)
      form.setValue("state", result.state)
      form.setValue("postalCode", result.postalCode)
      form.setValue("country", result.country)
    }

    const pickerValue = form.watch("currentAddress")
      ? {
          address: form.watch("currentAddress") || "",
          city: form.watch("city") || "",
          state: form.watch("state") || "",
          country: form.watch("country") || "",
          postalCode: form.watch("postalCode") || "",
          latitude: 0,
          longitude: 0,
        }
      : null

    if (hasMapbox) {
      return (
        <Form {...form}>
          <form className="space-y-6">
            <MapboxLocationPicker
              value={pickerValue}
              onChange={handleLocationChange}
              placeholder="Search for an address..."
            />
          </form>
        </Form>
      )
    }

    // Fallback to manual input fields when Mapbox is not configured
    return (
      <Form {...form}>
        <form className="space-y-6">
          <TextareaField
            name="currentAddress"
            label="Current Address"
            placeholder="Enter current address"
            disabled={isPending}
          />
          <InputField
            name="city"
            label="City"
            placeholder="Enter city"
            disabled={isPending}
          />
          <InputField
            name="state"
            label="State"
            placeholder="Enter state"
            disabled={isPending}
          />
          <InputField
            name="postalCode"
            label="Postal Code"
            placeholder="Enter postal code"
            disabled={isPending}
          />
          <InputField
            name="country"
            label="Country"
            placeholder="Enter country"
            disabled={isPending}
          />
        </form>
      </Form>
    )
  }
)

LocationForm.displayName = "LocationForm"
