"use client"

import React, { useEffect } from "react"
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
import { FormHeading } from "@/components/form"
import { useWizardValidation } from "@/components/form/template/wizard-validation-context"
import { useLocale } from "@/components/internationalization/use-locale"

import { GENDER_OPTIONS, STEP_META } from "../config"
import { useOnboarding } from "../use-onboarding"
import { personalSchema, type PersonalSchemaType } from "../validation"

export function PersonalStep() {
  const router = useRouter()
  const params = useParams()
  const { locale } = useLocale()
  const subdomain = params.subdomain as string

  const { state, updateStepData } = useOnboarding()
  const { enableNext, disableNext, setCustomNavigation } = useWizardValidation()

  const initialData = state.formData.personal
  const autoFill = state.applicationData

  const form = useForm<PersonalSchemaType>({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      givenName: initialData?.givenName || autoFill?.firstName || "",
      middleName: initialData?.middleName || autoFill?.middleName || "",
      surname: initialData?.surname || autoFill?.lastName || "",
      dateOfBirth: initialData?.dateOfBirth || autoFill?.dateOfBirth || "",
      gender: initialData?.gender || autoFill?.gender || "",
      nationality: initialData?.nationality || autoFill?.nationality || "",
      profilePhotoUrl: initialData?.profilePhotoUrl || autoFill?.photoUrl || "",
    },
  })

  // Sync form changes to context
  useEffect(() => {
    const subscription = form.watch((value) => {
      updateStepData("personal", value as PersonalSchemaType)
    })
    return () => subscription.unsubscribe()
  }, [form, updateStepData])

  // Validation + navigation
  useEffect(() => {
    const data = form.watch()
    const isValid =
      data.givenName && data.surname && data.dateOfBirth && data.gender

    if (isValid) {
      enableNext()
      setCustomNavigation({
        onNext: async () => {
          const valid = await form.trigger()
          if (valid) {
            updateStepData("personal", form.getValues())
            router.push(`/${locale}/s/${subdomain}/join/contact`)
          }
        },
      })
    } else {
      disableNext()
      setCustomNavigation(undefined)
    }
  })

  const meta = STEP_META.personal

  return (
    <div className="space-y-8">
      <FormHeading title={meta.title} description={meta.description} />

      <Form {...form}>
        <form className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="givenName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter first name" />
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
                  <FormLabel>Middle Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter middle name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="surname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter last name" />
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
                  <FormLabel>Date of Birth *</FormLabel>
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
                  <FormLabel>Gender *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GENDER_OPTIONS.map((option) => (
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
                <FormLabel>Nationality</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter nationality" />
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
