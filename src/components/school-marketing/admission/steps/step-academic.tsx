"use client"

import { useEffect } from "react"
import { useFormContext } from "react-hook-form"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
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
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { ApplicationFormData, PublicCampaign } from "../types"
import { DEFAULT_GRADES, suggestGradeFromDOB } from "../types"

interface Props {
  dictionary: Dictionary
  lang: Locale
  campaign: PublicCampaign
}

const STREAMS = [
  { value: "Science", label: "العلوم" },
  { value: "Arts", label: "الآداب" },
  { value: "Commerce", label: "التجارة" },
  { value: "General", label: "عام" },
]

const LANGUAGES = [
  { value: "Arabic", label: "العربية" },
  { value: "English", label: "الإنجليزية" },
  { value: "French", label: "الفرنسية" },
  { value: "None", label: "لا شيء" },
]

export default function StepAcademic({ dictionary, lang, campaign }: Props) {
  const { control, watch, setValue } = useFormContext<ApplicationFormData>()
  const isRTL = lang === "ar"
  const dateOfBirth = watch("dateOfBirth")

  // Auto-suggest grade based on DOB
  useEffect(() => {
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth)
      const suggestedGrade = suggestGradeFromDOB(dob)
      if (suggestedGrade) {
        // Only set if not already set
        const currentGrade = watch("applyingForClass")
        if (!currentGrade) {
          setValue("applyingForClass", suggestedGrade.grade)
        }
      }
    }
  }, [dateOfBirth, setValue, watch])

  return (
    <div className="space-y-6">
      {/* Previous Education */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {isRTL ? "التعليم السابق" : "Previous Education"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={control}
              name="previousSchool"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isRTL ? "المدرسة السابقة" : "Previous School"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={
                        isRTL ? "أدخل اسم المدرسة" : "Enter school name"
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="previousClass"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isRTL ? "الصف السابق" : "Previous Class/Grade"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={isRTL ? "مثل: الصف الرابع" : "e.g., Grade 4"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={control}
              name="previousMarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isRTL ? "الدرجات / النسبة المئوية" : "Marks / Percentage"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={isRTL ? "مثل: 85%" : "e.g., 85%"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="previousPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isRTL ? "المعدل التراكمي" : "GPA (if applicable)"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={isRTL ? "مثل: 3.5" : "e.g., 3.5"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={control}
            name="achievements"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {isRTL ? "الإنجازات والجوائز" : "Achievements & Awards"}
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={
                      isRTL
                        ? "أدخل أي إنجازات أو جوائز"
                        : "Enter any achievements or awards"
                    }
                    rows={2}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Applying For */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {isRTL ? "التقديم لـ" : "Applying For"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="applyingForClass"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {isRTL ? "الصف المتقدم إليه" : "Grade Applying For"}{" "}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={isRTL ? "اختر الصف" : "Select grade"}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DEFAULT_GRADES.map((grade) => (
                      <SelectItem key={grade.grade} value={grade.grade}>
                        {grade.grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField
              control={control}
              name="preferredStream"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isRTL ? "التخصص المفضل" : "Preferred Stream"}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={isRTL ? "اختر التخصص" : "Select stream"}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STREAMS.map((stream) => (
                        <SelectItem key={stream.value} value={stream.value}>
                          {stream.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="secondLanguage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isRTL ? "اللغة الثانية" : "Second Language"}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={isRTL ? "اختر اللغة" : "Select language"}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LANGUAGES.map((language) => (
                        <SelectItem key={language.value} value={language.value}>
                          {language.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="thirdLanguage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isRTL ? "اللغة الثالثة" : "Third Language"}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={isRTL ? "اختر اللغة" : "Select language"}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LANGUAGES.map((language) => (
                        <SelectItem key={language.value} value={language.value}>
                          {language.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
