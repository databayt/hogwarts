"use client"

import React, { forwardRef, useEffect, useImperativeHandle } from "react"
import { useParams } from "next/navigation"
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
import { useLocale } from "@/components/internationalization/use-locale"

import { useApplySession } from "../application-context"
import { savePersonalStep } from "./actions"
import {
  CATEGORY_OPTIONS,
  GENDER_OPTIONS,
  NATIONALITY_OPTIONS,
  RELIGION_OPTIONS,
} from "./config"
import type { PersonalFormProps, PersonalFormRef } from "./types"
import { personalSchema, type PersonalSchemaType } from "./validation"

export const PersonalForm = forwardRef<PersonalFormRef, PersonalFormProps>(
  ({ initialData, onSuccess, dictionary }, ref) => {
    const params = useParams()
    const subdomain = params.subdomain as string
    const { locale: lang } = useLocale()
    const isRTL = lang === "ar"
    const { session, updateStepData } = useApplySession()

    const form = useForm<PersonalSchemaType>({
      resolver: zodResolver(personalSchema),
      defaultValues: {
        firstName: initialData?.firstName || "",
        middleName: initialData?.middleName || "",
        lastName: initialData?.lastName || "",
        dateOfBirth: initialData?.dateOfBirth || "",
        gender: initialData?.gender || undefined,
        nationality: initialData?.nationality || "",
        religion: initialData?.religion || "",
        category: initialData?.category || "",
      },
    })

    const dict = ((dictionary as Record<string, Record<string, string>> | null)
      ?.apply?.personal ?? {}) as Record<string, string>

    // Update context when form values change
    useEffect(() => {
      const subscription = form.watch((value) => {
        updateStepData("personal", value as PersonalSchemaType)
      })
      return () => subscription.unsubscribe()
    }, [form, updateStepData])

    const saveAndNext = async () => {
      // Validate form
      const isValid = await form.trigger()
      if (!isValid) {
        throw new Error("Form validation failed")
      }

      const data = form.getValues()

      // Validate on server
      const result = await savePersonalStep(data)

      if (!result.success) {
        throw new Error(result.error || "Failed to save")
      }

      // Update context with validated data
      if (result.data) {
        updateStepData("personal", result.data)
      }

      onSuccess?.()
    }

    // Expose saveAndNext to parent via ref
    useImperativeHandle(ref, () => ({
      saveAndNext,
    }))

    return (
      <Form {...form}>
        <form className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {dict.firstName || (isRTL ? "الاسم الأول" : "First Name")} *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={
                        dict.firstNamePlaceholder ||
                        (isRTL ? "أدخل الاسم الأول" : "Enter first name")
                      }
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
                  <FormLabel>
                    {dict.middleName ||
                      (isRTL ? "الاسم الأوسط" : "Middle Name")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={
                        dict.middleNamePlaceholder ||
                        (isRTL ? "أدخل الاسم الأوسط" : "Enter middle name")
                      }
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
                  <FormLabel>
                    {dict.lastName || (isRTL ? "اسم العائلة" : "Last Name")} *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={
                        dict.lastNamePlaceholder ||
                        (isRTL ? "أدخل اسم العائلة" : "Enter last name")
                      }
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
                  <FormLabel>
                    {dict.dateOfBirth ||
                      (isRTL ? "تاريخ الميلاد" : "Date of Birth")}{" "}
                    *
                  </FormLabel>
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
                  <FormLabel>
                    {dict.gender || (isRTL ? "الجنس" : "Gender")} *
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            dict.selectGender ||
                            (isRTL ? "اختر الجنس" : "Select gender")
                          }
                        />
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

          {/* Nationality and Religion */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {dict.nationality || (isRTL ? "الجنسية" : "Nationality")} *
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            dict.selectNationality ||
                            (isRTL ? "اختر الجنسية" : "Select nationality")
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {NATIONALITY_OPTIONS.map((option) => (
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

            <FormField
              control={form.control}
              name="religion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {dict.religion || (isRTL ? "الديانة" : "Religion")}
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            dict.selectReligion ||
                            (isRTL ? "اختر الديانة" : "Select religion")
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RELIGION_OPTIONS.map((option) => (
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

          {/* Category */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {dict.category || (isRTL ? "الفئة" : "Category")}
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          dict.selectCategory ||
                          (isRTL ? "اختر الفئة" : "Select category")
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((option) => (
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
        </form>
      </Form>
    )
  }
)

PersonalForm.displayName = "PersonalForm"
