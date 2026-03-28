"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
} from "react"
import dynamic from "next/dynamic"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { type LocationResult } from "@/lib/mapbox"
import { Form } from "@/components/ui/form"
import { Skeleton } from "@/components/ui/skeleton"
import { CountryField, InputField, TextareaField } from "@/components/form"
import { createI18nHelpers } from "@/components/internationalization/helpers"

import { useApplySession } from "../application-context"
import { useAutoFillMerge } from "../use-auto-fill-merge"
import { getApplyDict } from "../utils"
import { saveLocationStep } from "./actions"
import type { LocationFormProps, LocationFormRef } from "./types"
import {
  createLocationSchema,
  locationSchema,
  type LocationSchemaType,
} from "./validation"

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

    const schema = useMemo(() => {
      const messages = (dictionary as Record<string, unknown>)?.messages as
        | Record<string, unknown>
        | undefined
      if (!messages) return locationSchema
      const { validation } = createI18nHelpers(messages as never)
      return createLocationSchema(validation)
    }, [dictionary])

    const form = useForm<LocationSchemaType>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(schema) as any,
      defaultValues: {
        address: initialData?.address || "",
        city: initialData?.city || "",
        state: initialData?.state || "",
        postalCode: initialData?.postalCode || "",
        country: initialData?.country || "",
      },
    })

    // Merge AI-extracted data into empty fields (late-arrival insurance)
    useAutoFillMerge(form, initialData)

    const dict = getApplyDict(dictionary, "location")

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
              placeholder={dict.searchAddress}
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
            label={`${dict.address} *`}
            placeholder={dict.addressPlaceholder}
          />
          <InputField
            name="city"
            label={`${dict.city} *`}
            placeholder={dict.cityPlaceholder}
          />
          <InputField
            name="state"
            label={`${dict.state} *`}
            placeholder={dict.statePlaceholder}
          />
          <InputField
            name="postalCode"
            label={dict.postalCode}
            placeholder={dict.postalCodePlaceholder}
          />
          <CountryField
            name="country"
            label={`${dict.country} *`}
            placeholder={dict.selectCountry}
          />
        </form>
      </Form>
    )
  }
)

LocationForm.displayName = "LocationForm"
