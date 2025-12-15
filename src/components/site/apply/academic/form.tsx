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
import { Textarea } from "@/components/ui/textarea"
import { useLocale } from "@/components/internationalization/use-locale"

import { useApplication } from "../application-context"
import { DEFAULT_GRADES } from "../types"
import { saveAcademicStep } from "./actions"
import { LANGUAGE_OPTIONS, STREAM_OPTIONS } from "./config"
import type { AcademicFormProps, AcademicFormRef } from "./types"
import { academicSchema, type AcademicSchemaType } from "./validation"

export const AcademicForm = forwardRef<AcademicFormRef, AcademicFormProps>(
  ({ initialData, onSuccess, dictionary }, ref) => {
    const params = useParams()
    const subdomain = params.subdomain as string
    const { locale: lang } = useLocale()
    const isRTL = lang === "ar"
    const { session, updateStepData } = useApplication()

    const form = useForm<AcademicSchemaType>({
      resolver: zodResolver(academicSchema),
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

    const dict = ((dictionary as Record<string, Record<string, string>> | null)
      ?.apply?.academic ?? {}) as Record<string, string>

    useEffect(() => {
      const subscription = form.watch((value) => {
        updateStepData("academic", value as AcademicSchemaType)
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
            <h3 className="text-lg font-semibold">
              {dict.previousEducation ||
                (isRTL ? "التعليم السابق" : "Previous Education")}
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="previousSchool"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {dict.previousSchool ||
                        (isRTL ? "المدرسة السابقة" : "Previous School")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={
                          dict.schoolPlaceholder ||
                          (isRTL ? "اسم المدرسة" : "School name")
                        }
                      />
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
                    <FormLabel>
                      {dict.previousClass ||
                        (isRTL ? "الصف السابق" : "Previous Class")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={
                          dict.classPlaceholder ||
                          (isRTL ? "مثال: الصف الخامس" : "e.g., Grade 5")
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="previousMarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {dict.previousMarks ||
                        (isRTL ? "الدرجات السابقة" : "Previous Marks")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={
                          dict.marksPlaceholder ||
                          (isRTL ? "مثال: 450/500" : "e.g., 450/500")
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="previousPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {dict.previousPercentage ||
                        (isRTL ? "النسبة المئوية" : "Percentage")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={
                          dict.percentagePlaceholder ||
                          (isRTL ? "مثال: 90%" : "e.g., 90%")
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Applying For */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {dict.applyingFor || (isRTL ? "التقديم لـ" : "Applying For")}
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="applyingForClass"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {dict.applyingForClass ||
                        (isRTL
                          ? "الصف المتقدم إليه"
                          : "Applying for Class")}{" "}
                      *
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              dict.selectClass ||
                              (isRTL ? "اختر الصف" : "Select class")
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEFAULT_GRADES.map((grade) => (
                          <SelectItem key={grade.grade} value={grade.grade}>
                            {isRTL ? grade.gradeAr : grade.grade}
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
                    <FormLabel>
                      {dict.preferredStream ||
                        (isRTL ? "المسار المفضل" : "Preferred Stream")}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              dict.selectStream ||
                              (isRTL ? "اختر المسار" : "Select stream")
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STREAM_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {isRTL ? option.labelAr : option.label}
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

          {/* Languages */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {dict.languages || (isRTL ? "اللغات" : "Languages")}
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="secondLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {dict.secondLanguage ||
                        (isRTL ? "اللغة الثانية" : "Second Language")}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              dict.selectLanguage ||
                              (isRTL ? "اختر اللغة" : "Select language")
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LANGUAGE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {isRTL ? option.labelAr : option.label}
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
                name="thirdLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {dict.thirdLanguage ||
                        (isRTL ? "اللغة الثالثة" : "Third Language")}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              dict.selectLanguage ||
                              (isRTL ? "اختر اللغة" : "Select language")
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LANGUAGE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {isRTL ? option.labelAr : option.label}
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
                <FormLabel>
                  {dict.achievements || (isRTL ? "الإنجازات" : "Achievements")}
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={4}
                    placeholder={
                      dict.achievementsPlaceholder ||
                      (isRTL
                        ? "أدخل أي إنجازات أو جوائز"
                        : "Enter any achievements or awards")
                    }
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
