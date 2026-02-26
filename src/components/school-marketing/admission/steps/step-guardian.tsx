"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
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
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { ApplicationFormData } from "../types"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default function StepGuardian({ dictionary, lang }: Props) {
  const { control } = useFormContext<ApplicationFormData>()
  const isRTL = lang === "ar"

  const dict =
    (
      dictionary as unknown as {
        school?: { admission?: { formSteps?: Record<string, string> } }
      }
    )?.school?.admission?.formSteps ?? {}

  return (
    <div className="space-y-6">
      {/* Father's Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {dict.fatherInfo || "Father's Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={control}
              name="fatherName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {dict.fatherName || "Father's Name"}{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={
                        dict.enterFatherName || "Enter father's name"
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="fatherOccupation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.occupation || "Occupation"}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={dict.enterOccupation || "Enter occupation"}
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
              name="fatherPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.phoneNumber || "Phone Number"}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder="+249 123 456 789"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="fatherEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.emailAddress || "Email"}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="father@email.com"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Mother's Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {dict.motherInfo || "Mother's Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={control}
              name="motherName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {dict.motherName || "Mother's Name"}{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={
                        dict.enterMotherName || "Enter mother's name"
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="motherOccupation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.occupation || "Occupation"}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={dict.enterOccupation || "Enter occupation"}
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
              name="motherPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.phoneNumber || "Phone Number"}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder="+249 123 456 789"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="motherEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.emailAddress || "Email"}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="mother@email.com"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Guardian Information (Optional) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {dict.guardianInfoOptional || "Guardian Information (Optional)"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground mb-4 text-sm">
            {dict.guardianNote ||
              "Complete this section only if the guardian is different from parents"}
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={control}
              name="guardianName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.guardianName || "Guardian Name"}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={dict.enterName || "Enter name"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="guardianRelation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.relationship || "Relationship"}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={
                        dict.relationshipPlaceholder || "e.g., Uncle, Aunt"
                      }
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
              name="guardianPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.phoneNumber || "Phone Number"}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder="+249 123 456 789"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="guardianEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.emailAddress || "Email"}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="guardian@email.com"
                    />
                  </FormControl>
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
