"use client"

import React, { useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Icons } from "@/components/icons"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import {
  CURRENCIES,
  PAYMENT_SCHEDULES,
  SCHOOL_CATEGORIES,
  SCHOOL_TYPES,
} from "./config"
import type { OnboardingSchoolData, OnboardingStep } from "./types"
import {
  capacityStepValidation,
  descriptionStepValidation,
  locationStepValidation,
  onboardingValidation,
  priceStepValidation,
  titleStepValidation,
} from "./validation"

interface OnboardingFormProps {
  step: OnboardingStep
  data: Partial<OnboardingSchoolData>
  onSubmit: (data: Partial<OnboardingSchoolData>) => Promise<void>
  onBack?: () => void
  isSubmitting?: boolean
  showNavigation?: boolean
  dictionary?: Dictionary["school"]
}

export function OnboardingForm({
  step,
  data,
  onSubmit,
  onBack,
  isSubmitting = false,
  showNavigation = true,
  dictionary,
}: OnboardingFormProps) {
  // Get form dictionary with fallbacks
  const t = useMemo(
    () =>
      dictionary?.onboarding?.form || {
        stepTitles: {
          title: "School Name",
          description: "School Description",
          location: "School Location",
          capacity: "School Capacity",
          price: "Pricing Setup",
        },
        navigation: {
          back: "Back",
          continue: "Continue",
        },
        titleStep: {
          label: "School Name",
          placeholder: "Enter your school name",
          description: "This will be displayed as your school's main title",
        },
        descriptionStep: {
          label: "School Description",
          placeholder: "Tell us about your school and what makes it special...",
          description:
            "Provide a brief overview of your school's mission and values",
          levelLabel: "School Level",
          levelPlaceholder: "Select level",
          typeLabel: "School Type",
          typePlaceholder: "Select type",
        },
        locationStep: {
          addressLabel: "School Address",
          addressPlaceholder: "Enter the full address of your school",
          cityLabel: "City",
          cityPlaceholder: "City",
          stateLabel: "State/Province",
          statePlaceholder: "State",
          countryLabel: "Country",
          countryPlaceholder: "Country",
        },
        capacityStep: {
          maxStudentsLabel: "Maximum Students",
          maxStudentsPlaceholder: "400",
          maxStudentsDescription: "Total enrollment capacity",
          maxTeachersLabel: "Maximum Teachers",
          maxTeachersPlaceholder: "25",
          maxTeachersDescription: "Total faculty capacity",
          maxClassesLabel: "Maximum Classes",
          maxClassesPlaceholder: "30",
          maxClassesDescription: "Total number of classes/sections",
        },
        priceStep: {
          currencyLabel: "Currency",
          currencyPlaceholder: "Select currency",
          scheduleLabel: "Payment Schedule",
          schedulePlaceholder: "Select schedule",
          tuitionLabel: "Tuition Fee",
          tuitionPlaceholder: "15000",
          tuitionDescription: "Annual tuition fee amount",
          registrationLabel: "Registration Fee",
          registrationPlaceholder: "500",
          applicationLabel: "Application Fee",
          applicationPlaceholder: "100",
        },
      },
    [dictionary]
  )

  const getValidationSchema = () => {
    switch (step) {
      case "title":
        return titleStepValidation
      case "description":
        return descriptionStepValidation
      case "location":
        return locationStepValidation
      case "capacity":
        return capacityStepValidation
      case "price":
        return priceStepValidation
      default:
        return onboardingValidation.partial()
    }
  }

  const form = useForm({
    resolver: zodResolver(getValidationSchema()),
    defaultValues: data,
  })

  const handleSubmit = async (formData: any) => {
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error("Form submission error:", error)
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case "title":
        return <TitleStepForm form={form} t={t.titleStep} />
      case "description":
        return <DescriptionStepForm form={form} t={t.descriptionStep} />
      case "location":
        return <LocationStepForm form={form} t={t.locationStep} />
      case "capacity":
        return <CapacityStepForm form={form} t={t.capacityStep} />
      case "price":
        return <PriceStepForm form={form} t={t.priceStep} />
      default:
        return <div>Step content not implemented</div>
    }
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>
          {step === "title" && t.stepTitles?.title}
          {step === "description" && t.stepTitles?.description}
          {step === "location" && t.stepTitles?.location}
          {step === "capacity" && t.stepTitles?.capacity}
          {step === "price" && t.stepTitles?.price}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {renderStepContent()}

            {showNavigation && (
              <div className="flex justify-between pt-6">
                {onBack && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    disabled={isSubmitting}
                  >
                    {t.navigation?.back || "Back"}
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={!onBack ? "w-full" : ""}
                >
                  {isSubmitting && (
                    <Icons.loader2 className="me-2 h-4 w-4 animate-spin" />
                  )}
                  {t.navigation?.continue || "Continue"}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

// Individual step form components
function TitleStepForm({ form, t }: { form: any; t: any }) {
  return (
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t?.label || "School Name"} *</FormLabel>
          <FormControl>
            <Input
              placeholder={t?.placeholder || "Enter your school name"}
              {...field}
              className="text-lg"
            />
          </FormControl>
          <FormDescription>
            {t?.description ||
              "This will be displayed as your school's main title"}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function DescriptionStepForm({ form, t }: { form: any; t: any }) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t?.label || "School Description"} *</FormLabel>
            <FormControl>
              <Textarea
                placeholder={
                  t?.placeholder ||
                  "Tell us about your school and what makes it special..."
                }
                className="min-h-[120px]"
                {...field}
              />
            </FormControl>
            <FormDescription>
              {t?.description ||
                "Provide a brief overview of your school's mission and values"}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="schoolLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t?.levelLabel || "School Level"}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t?.levelPlaceholder || "Select level"}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SCHOOL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-muted-foreground text-sm">
                          {type.description}
                        </div>
                      </div>
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
          name="schoolType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t?.typeLabel || "School Type"}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t?.typePlaceholder || "Select type"}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SCHOOL_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <div>
                        <div className="font-medium">{category.label}</div>
                        <div className="text-muted-foreground text-sm">
                          {category.description}
                        </div>
                      </div>
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
  )
}

function LocationStepForm({ form, t }: { form: any; t: any }) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t?.addressLabel || "School Address"} *</FormLabel>
            <FormControl>
              <Input
                placeholder={
                  t?.addressPlaceholder ||
                  "Enter the full address of your school"
                }
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t?.cityLabel || "City"} *</FormLabel>
              <FormControl>
                <Input placeholder={t?.cityPlaceholder || "City"} {...field} />
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
              <FormLabel>{t?.stateLabel || "State/Province"} *</FormLabel>
              <FormControl>
                <Input
                  placeholder={t?.statePlaceholder || "State"}
                  {...field}
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
              <FormLabel>{t?.countryLabel || "Country"}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t?.countryPlaceholder || "Country"}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}

function CapacityStepForm({ form, t }: { form: any; t: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormField
          control={form.control}
          name="maxStudents"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t?.maxStudentsLabel || "Maximum Students"} *
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  max="10000"
                  placeholder={t?.maxStudentsPlaceholder || "400"}
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value) || 0)
                  }
                />
              </FormControl>
              <FormDescription>
                {t?.maxStudentsDescription || "Total enrollment capacity"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maxTeachers"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t?.maxTeachersLabel || "Maximum Teachers"} *
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  placeholder={t?.maxTeachersPlaceholder || "25"}
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value) || 0)
                  }
                />
              </FormControl>
              <FormDescription>
                {t?.maxTeachersDescription || "Total faculty capacity"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="maxClasses"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t?.maxClassesLabel || "Maximum Classes"}</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="1"
                max="500"
                placeholder={t?.maxClassesPlaceholder || "30"}
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
              />
            </FormControl>
            <FormDescription>
              {t?.maxClassesDescription || "Total number of classes/sections"}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

function PriceStepForm({ form, t }: { form: any; t: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t?.currencyLabel || "Currency"} *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t?.currencyPlaceholder || "Select currency"}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.symbol} {currency.label}
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
          name="paymentSchedule"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t?.scheduleLabel || "Payment Schedule"} *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t?.schedulePlaceholder || "Select schedule"}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PAYMENT_SCHEDULES.map((schedule) => (
                    <SelectItem key={schedule.value} value={schedule.value}>
                      <div>
                        <div className="font-medium">{schedule.label}</div>
                        <div className="text-muted-foreground text-sm">
                          {schedule.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="tuitionFee"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t?.tuitionLabel || "Tuition Fee"} *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={t?.tuitionPlaceholder || "15000"}
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseFloat(e.target.value) || 0)
                  }
                />
              </FormControl>
              <FormDescription>
                {t?.tuitionDescription || "Annual tuition fee amount"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="registrationFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t?.registrationLabel || "Registration Fee"}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={t?.registrationPlaceholder || "500"}
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="applicationFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t?.applicationLabel || "Application Fee"}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={t?.applicationPlaceholder || "100"}
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  )
}

export default OnboardingForm
