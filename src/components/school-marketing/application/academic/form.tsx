"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
} from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { createI18nHelpers } from "@/components/internationalization/helpers"
import { useLocale } from "@/components/internationalization/use-locale"

import { useApplySession } from "../application-context"
import { getApplyDict } from "../utils"
import { saveAcademicStep } from "./actions"
import { GRADE_OPTIONS, PERFORMANCE_OPTIONS, STREAM_OPTIONS } from "./config"
import type { AcademicFormProps, AcademicFormRef } from "./types"
import {
  academicSchema,
  createAcademicSchema,
  type AcademicSchemaType,
} from "./validation"

export const AcademicForm = forwardRef<AcademicFormRef, AcademicFormProps>(
  ({ initialData, onSuccess, dictionary }, ref) => {
    const params = useParams()
    const subdomain = params.subdomain as string
    const { locale: lang } = useLocale()
    const isRTL = lang === "ar"
    const { session, updateStepData } = useApplySession()

    const schema = useMemo(() => {
      const messages = (dictionary as Record<string, unknown>)?.messages as
        | Record<string, unknown>
        | undefined
      if (!messages) return academicSchema
      const { validation } = createI18nHelpers(messages as never)
      return createAcademicSchema(validation)
    }, [dictionary])

    const form = useForm<AcademicSchemaType>({
      resolver: zodResolver(schema),
      defaultValues: {
        previousSchool: initialData?.previousSchool || "",
        previousClass: initialData?.previousClass || "",
        previousMarks: initialData?.previousMarks || "",
        previousPercentage: initialData?.previousPercentage || "",
        achievements: initialData?.achievements || "",
        applyingForClass: initialData?.applyingForClass || "",
        preferredStream: initialData?.preferredStream || "",
        secondLanguage: initialData?.secondLanguage || "",
        thirdLanguage: initialData?.thirdLanguage || "",
      },
    })

    const dict = getApplyDict(dictionary, "academic")

    const prevDataRef = React.useRef<string>("")
    useEffect(() => {
      const subscription = form.watch((value) => {
        const json = JSON.stringify(value)
        if (json !== prevDataRef.current) {
          prevDataRef.current = json
          updateStepData("academic", value as AcademicSchemaType)
        }
      })
      return () => subscription.unsubscribe()
    }, [form, updateStepData])

    const saveAndNext = async () => {
      const isValid = await form.trigger()
      if (!isValid) throw new Error("Form validation failed")

      const data = form.getValues()
      const result = await saveAcademicStep(data)

      if (!result.success) throw new Error(result.error || "Failed to save")

      // Update context with validated data
      if (result.data) {
        updateStepData("academic", result.data)
      }

      onSuccess?.()
    }

    useImperativeHandle(ref, () => ({ saveAndNext }))

    return (
      <Form {...form}>
        <form className="space-y-8">
          {/* Previous Education */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="previousSchool"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dict.previousSchool}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={dict.schoolPlaceholder} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="previousClass"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dict.previousClass}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={dict.classPlaceholder} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GRADE_OPTIONS(isRTL).map((option) => (
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
                name="previousPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dict.performance}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={dict.selectPerformance} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PERFORMANCE_OPTIONS(isRTL).map((option) => (
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
          </div>

          {/* Applying For */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="applyingForClass"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dict.applyingForClass} *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={dict.selectClass} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GRADE_OPTIONS(isRTL).map((option) => (
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
                name="preferredStream"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dict.preferredStream}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={dict.selectStream} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STREAM_OPTIONS(isRTL).map((option) => (
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
          </div>

          {/* Achievements */}
          <FormField
            control={form.control}
            name="achievements"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{dict.achievements}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={4}
                    placeholder={dict.achievementsPlaceholder}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    )
  }
)

AcademicForm.displayName = "AcademicForm"
