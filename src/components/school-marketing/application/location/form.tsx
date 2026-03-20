"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useEffect, useImperativeHandle } from "react"
import dynamic from "next/dynamic"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { type LocationResult } from "@/lib/mapbox"
import { Form } from "@/components/ui/form"
import { Skeleton } from "@/components/ui/skeleton"
import { CountryField, InputField, TextareaField } from "@/components/form"

import { useApplySession } from "../application-context"
import { saveLocationStep } from "./actions"
import type { LocationFormProps, LocationFormRef } from "./types"
import { locationSchema, type LocationSchemaType } from "./validation"

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

export const LocationForm = forwardRef<LocationFormRef, LocationFormProps>(
  ({ initialData, onSuccess, dictionary }, ref) => {
    const { updateStepData } = useApplySession()
    const hasMapbox = !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    const [coords, setCoords] = React.useState<{
      latitude: number
      longitude: number
    }>({ latitude: 0, longitude: 0 })

    const form = useForm<LocationSchemaType>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(locationSchema) as any,
      defaultValues: {
        address: initialData?.address || "",
        city: initialData?.city || "",
        state: initialData?.state || "",
        postalCode: initialData?.postalCode || "",
        country: initialData?.country || "",
      },
    })

    const dict = ((dictionary as Record<string, Record<string, string>> | null)
      ?.apply?.location ?? {}) as Record<string, string>

    const prevDataRef = React.useRef<string>("")
    useEffect(() => {
      const subscription = form.watch((value) => {
        const json = JSON.stringify(value)
        if (json !== prevDataRef.current) {
          prevDataRef.current = json
          updateStepData("location", value as LocationSchemaType)
        }
      })
      return () => subscription.unsubscribe()
    }, [form, updateStepData])

    const saveAndNext = async () => {
      const isValid = await form.trigger()
      if (!isValid) throw new Error("Form validation failed")

      const data = form.getValues()
      const result = await saveLocationStep(data)

      if (!result.success) throw new Error(result.error || "Failed to save")

      if (result.data) {
        updateStepData("location", result.data)
      }

      onSuccess?.()
    }

    useImperativeHandle(ref, () => ({ saveAndNext }))

    const handleLocationChange = (result: LocationResult) => {
      form.setValue("address", result.address)
      form.setValue("city", result.city)
      form.setValue("state", result.state)
      form.setValue("postalCode", result.postalCode)
      form.setValue("country", result.country)
      setCoords({ latitude: result.latitude, longitude: result.longitude })
    }

    const pickerValue = form.watch("address")
      ? {
          address: form.watch("address") || "",
          city: form.watch("city") || "",
          state: form.watch("state") || "",
          country: form.watch("country") || "",
          postalCode: form.watch("postalCode") || "",
          latitude: coords.latitude,
          longitude: coords.longitude,
        }
      : null

    if (hasMapbox) {
      return (
        <Form {...form}>
          <form className="space-y-6">
            <MapboxLocationPicker
              value={pickerValue}
              onChange={handleLocationChange}
              placeholder={dict.searchAddress || "Search for an address..."}
            />
          </form>
        </Form>
      )
    }

    // Fallback to manual input fields
    return (
      <Form {...form}>
        <form className="space-y-6">
          <TextareaField
            name="address"
            label={`${dict.address || "Current Address"} *`}
            placeholder={dict.addressPlaceholder || "Enter current address"}
          />
          <InputField
            name="city"
            label={`${dict.city || "City"} *`}
            placeholder={dict.cityPlaceholder || "Enter city"}
          />
          <InputField
            name="state"
            label={`${dict.state || "State"} *`}
            placeholder={dict.statePlaceholder || "Enter state"}
          />
          <InputField
            name="postalCode"
            label={dict.postalCode || "Postal Code"}
            placeholder={dict.postalCodePlaceholder || "Enter postal code"}
          />
          <CountryField
            name="country"
            label={`${dict.country || "Country"} *`}
            placeholder={dict.selectCountry || "Select country"}
          />
        </form>
      </Form>
    )
  }
)

LocationForm.displayName = "LocationForm"
