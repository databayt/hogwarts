"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CountryDropdown } from "@/components/atom/country-dropdown"
import { FormHeading } from "@/components/form"
import { useWizardValidation } from "@/components/form/template/wizard-validation-context"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"

import { getGenderOptions, getStepMeta } from "../config"
import { useOnboarding } from "../use-onboarding"
import { personalSchema, type PersonalSchemaType } from "../validation"

export function PersonalStep() {
  const router = useRouter()
  const params = useParams()
  const { locale } = useLocale()
  const subdomain = params.subdomain as string
  const { dictionary } = useDictionary()

  const d = dictionary?.school?.onboarding?.internalJoin
  const meta = useMemo(() => getStepMeta(d).personal, [d])
  const genderOptions = useMemo(() => getGenderOptions(d), [d])

  const { state, updateStepData } = useOnboarding()
  const { enableNext, disableNext, setCustomNavigation } = useWizardValidation()

  const initialData = state.formData.personal
  const autoFill = state.applicationData

  const form = useForm<PersonalSchemaType>({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      firstName: initialData?.firstName || autoFill?.firstName || "",
      middleName: initialData?.middleName || autoFill?.middleName || "",
      lastName: initialData?.lastName || autoFill?.lastName || "",
      dateOfBirth: initialData?.dateOfBirth || autoFill?.dateOfBirth || "",
      gender: initialData?.gender || autoFill?.gender || "",
      nationality: initialData?.nationality || autoFill?.nationality || "",
      profilePhotoUrl: initialData?.profilePhotoUrl || autoFill?.photoUrl || "",
    },
  })

  // Sync form data + validation + navigation via single watch subscription
  useEffect(() => {
    const evaluate = (value: Partial<PersonalSchemaType>) => {
      updateStepData("personal", value as PersonalSchemaType)

      const isValid =
        value.firstName && value.lastName && value.dateOfBirth && value.gender
      if (isValid) {
        enableNext()
        setCustomNavigation({
          onNext: async () => {
            const valid = await form.trigger()
            if (valid) {
              updateStepData("personal", form.getValues())
              router.push(`/${locale}/internal-onboarding/contact`)
            }
          },
        })
      } else {
        disableNext()
        setCustomNavigation(undefined)
      }
    }

    // Evaluate initial values
    evaluate(form.getValues())

    const subscription = form.watch((value) => {
      evaluate(value as Partial<PersonalSchemaType>)
    })
    return () => subscription.unsubscribe()
  }, [
    form,
    updateStepData,
    enableNext,
    disableNext,
    setCustomNavigation,
    router,
    locale,
    subdomain,
  ])

  const p = d?.personal

  return (
    <div className="space-y-8">
      <FormHeading title={meta.title} description={meta.description} />

      <Form {...form}>
        <form className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{p?.firstName ?? "First Name"} *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={p?.enterFirstName ?? "Enter first name"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="middleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{p?.middleName ?? "Middle Name"}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={p?.enterMiddleName ?? "Enter middle name"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{p?.lastName ?? "Last Name"} *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={p?.enterLastName ?? "Enter last name"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Date of Birth and Gender */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{p?.dateOfBirth ?? "Date of Birth"} *</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{p?.gender ?? "Gender"} *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={p?.selectGender ?? "Select gender"}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {genderOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Nationality */}
          <FormField
            control={form.control}
            name="nationality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{p?.nationality ?? "Nationality"}</FormLabel>
                <FormControl>
                  <CountryDropdown
                    value={field.value}
                    onChange={(isoCode) => field.onChange(isoCode)}
                    placeholder={p?.selectNationality ?? "Select nationality"}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  )
}
