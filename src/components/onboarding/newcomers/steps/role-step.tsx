"use client"

import * as React from "react"
import { useFormContext } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { FormStepContainer, FormStepHeader } from "@/components/form"

import { NEWCOMER_ROLES, NEWCOMER_STEPS } from "../config"

/**
 * Role Selection Step
 *
 * First step of newcomers onboarding.
 * User selects their role: teacher, staff, parent, or student.
 */
export function RoleStep() {
  const form = useFormContext()
  const stepConfig = NEWCOMER_STEPS[0]

  return (
    <FormStepContainer maxWidth="lg">
      <FormStepHeader
        stepNumber={1}
        totalSteps={5}
        title={stepConfig?.title || "Select Your Role"}
        description={stepConfig?.description}
        showStepIndicator={false}
      />

      <FormField
        control={form.control}
        name="role"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="grid grid-cols-1 gap-4 md:grid-cols-2"
              >
                {NEWCOMER_ROLES.map((role) => {
                  const Icon = role.icon
                  const isSelected = field.value === role.value

                  return (
                    <label key={role.value} className="cursor-pointer">
                      <Card
                        className={cn(
                          "hover:border-primary/50 transition-all",
                          isSelected &&
                            "border-primary bg-primary/5 ring-primary ring-1"
                        )}
                      >
                        <CardContent className="flex items-start gap-4 p-4">
                          <RadioGroupItem value={role.value} className="mt-1" />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Icon className="text-primary h-5 w-5" />
                              <span className="font-medium">{role.label}</span>
                            </div>
                            <p className="text-muted-foreground text-sm">
                              {role.description}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </label>
                  )
                })}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormStepContainer>
  )
}
