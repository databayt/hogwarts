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
import { saveContactStep } from "./actions"
import { COUNTRY_OPTIONS } from "./config"
import type { ContactFormProps, ContactFormRef } from "./types"
import { contactSchema, type ContactSchemaType } from "./validation"

export const ContactForm = forwardRef<ContactFormRef, ContactFormProps>(
  ({ initialData, onSuccess, dictionary }, ref) => {
    const params = useParams()
    const subdomain = params.subdomain as string
    const { locale: lang } = useLocale()
    const isRTL = lang === "ar"
    const { session, updateStepData } = useApplySession()

    const form = useForm<ContactSchemaType>({
      resolver: zodResolver(contactSchema),
      defaultValues: {
        email: initialData?.email || "",
        phone: initialData?.phone || "",
        alternatePhone: initialData?.alternatePhone || "",
        address: initialData?.address || "",
        city: initialData?.city || "",
        state: initialData?.state || "",
        postalCode: initialData?.postalCode || "",
        country: initialData?.country || "",
      },
    })

    const dict = ((dictionary as Record<string, Record<string, string>> | null)
      ?.apply?.contact ?? {}) as Record<string, string>

    useEffect(() => {
      const subscription = form.watch((value) => {
        updateStepData("contact", value as ContactSchemaType)
      })
      return () => subscription.unsubscribe()
    }, [form, updateStepData])

    const saveAndNext = async () => {
      const isValid = await form.trigger()
      if (!isValid) throw new Error("Form validation failed")

      const data = form.getValues()
      const result = await saveContactStep(data)

      if (!result.success) throw new Error(result.error || "Failed to save")

      // Update context with validated data
      if (result.data) {
        updateStepData("contact", result.data)
      }

      onSuccess?.()
    }

    useImperativeHandle(ref, () => ({ saveAndNext }))

    return (
      <Form {...form}>
        <form className="space-y-6">
          {/* Email and Phone */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {dict.email || (isRTL ? "البريد الإلكتروني" : "Email")} *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder={dict.emailPlaceholder || "email@example.com"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {dict.phone || (isRTL ? "رقم الهاتف" : "Phone")} *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder={dict.phonePlaceholder || "+249 XXX XXX XXXX"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Alternate Phone */}
          <FormField
            control={form.control}
            name="alternatePhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {dict.alternatePhone ||
                    (isRTL ? "هاتف بديل" : "Alternate Phone")}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="tel"
                    placeholder={
                      dict.alternatePhonePlaceholder || "+249 XXX XXX XXXX"
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Address */}
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {dict.address || (isRTL ? "العنوان" : "Address")} *
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={
                      dict.addressPlaceholder ||
                      (isRTL ? "أدخل العنوان" : "Enter address")
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* City and State */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {dict.city || (isRTL ? "المدينة" : "City")} *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={
                        dict.cityPlaceholder ||
                        (isRTL ? "أدخل المدينة" : "Enter city")
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {dict.state || (isRTL ? "الولاية" : "State")} *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={
                        dict.statePlaceholder ||
                        (isRTL ? "أدخل الولاية" : "Enter state")
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Postal Code and Country */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {dict.postalCode ||
                      (isRTL ? "الرمز البريدي" : "Postal Code")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={dict.postalCodePlaceholder || "12345"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {dict.country || (isRTL ? "الدولة" : "Country")} *
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            dict.selectCountry ||
                            (isRTL ? "اختر الدولة" : "Select country")
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COUNTRY_OPTIONS(isRTL).map((option) => (
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
        </form>
      </Form>
    )
  }
)

ContactForm.displayName = "ContactForm"
