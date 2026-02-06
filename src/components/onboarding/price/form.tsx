"use client"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { FormField } from "../form-field"
import { StepNavigation } from "../step-navigation"
import { StepWrapper } from "../step-wrapper"
import { usePrice } from "./use-price"

export function PriceForm() {
  const { dictionary } = useDictionary()
  const { form, onSubmit, onBack, isLoading, error, isFormValid } = usePrice()

  return (
    <StepWrapper>
      <form onSubmit={onSubmit} className="space-y-8">
        <div className="space-y-6">
          <FormField
            label={
              dictionary?.marketing?.onboarding?.pricing?.tuitionFee ||
              "Tuition Fee"
            }
            description={
              dictionary?.marketing?.onboarding?.pricing?.tuitionFeeDesc ||
              "The base tuition fee for students."
            }
            error={form.formState.errors.tuitionFee?.message}
          >
            <div className="relative">
              <span className="text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2 transform">
                $
              </span>
              <input
                type="number"
                min="0"
                step="1"
                {...form.register("tuitionFee", { valueAsNumber: true })}
                className="border-border focus:ring-primary w-full rounded-lg border py-3 ps-8 pe-4 focus:border-transparent focus:ring-2"
                placeholder="5000"
              />
            </div>
          </FormField>

          <FormField
            label={
              dictionary?.marketing?.onboarding?.pricing?.registrationFee ||
              "Registration Fee (optional)"
            }
            description={
              dictionary?.marketing?.onboarding?.pricing?.registrationFeeDesc ||
              "A one-time fee for new student registration."
            }
            error={form.formState.errors.registrationFee?.message}
          >
            <div className="relative">
              <span className="text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2 transform">
                $
              </span>
              <input
                type="number"
                min="0"
                step="1"
                {...form.register("registrationFee", { valueAsNumber: true })}
                className="border-border focus:ring-primary w-full rounded-lg border py-3 ps-8 pe-4 focus:border-transparent focus:ring-2"
                placeholder="0"
              />
            </div>
          </FormField>

          <FormField
            label={
              dictionary?.marketing?.onboarding?.pricing?.applicationFee ||
              "Application Fee (optional)"
            }
            description={
              dictionary?.marketing?.onboarding?.pricing?.applicationFeeDesc ||
              "A fee for processing student applications."
            }
            error={form.formState.errors.applicationFee?.message}
          >
            <div className="relative">
              <span className="text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2 transform">
                $
              </span>
              <input
                type="number"
                min="0"
                step="1"
                {...form.register("applicationFee", { valueAsNumber: true })}
                className="border-border focus:ring-primary w-full rounded-lg border py-3 ps-8 pe-4 focus:border-transparent focus:ring-2"
                placeholder="0"
              />
            </div>
          </FormField>

          <FormField
            label={
              dictionary?.marketing?.onboarding?.pricing?.currency || "Currency"
            }
            description={
              dictionary?.marketing?.onboarding?.pricing?.currencyDesc ||
              "Select your preferred currency."
            }
            error={form.formState.errors.currency?.message}
          >
            <RadioGroup
              defaultValue={form.getValues("currency")}
              onValueChange={(value: string) =>
                form.setValue(
                  "currency",
                  value as "USD" | "EUR" | "GBP" | "CAD" | "AUD"
                )
              }
              className="grid grid-cols-2 gap-4 sm:grid-cols-3"
            >
              {["USD", "EUR", "GBP", "CAD", "AUD"].map((currency) => (
                <div key={currency} className="flex items-center gap-2">
                  <RadioGroupItem
                    value={currency}
                    id={`currency-${currency}`}
                  />
                  <Label htmlFor={`currency-${currency}`}>{currency}</Label>
                </div>
              ))}
            </RadioGroup>
          </FormField>

          <FormField
            label={
              dictionary?.marketing?.onboarding?.pricing?.paymentSchedule ||
              "Payment Schedule"
            }
            description={
              dictionary?.marketing?.onboarding?.pricing?.paymentScheduleDesc ||
              "Choose how often payments are collected."
            }
            error={form.formState.errors.paymentSchedule?.message}
          >
            <RadioGroup
              defaultValue={form.getValues("paymentSchedule")}
              onValueChange={(value: string) =>
                form.setValue(
                  "paymentSchedule",
                  value as "monthly" | "quarterly" | "semester" | "annual"
                )
              }
              className="grid grid-cols-2 gap-4"
            >
              {[
                {
                  value: "monthly",
                  label:
                    dictionary?.marketing?.onboarding?.pricing?.monthly ||
                    "Monthly",
                },
                {
                  value: "quarterly",
                  label:
                    dictionary?.marketing?.onboarding?.pricing?.quarterly ||
                    "Quarterly",
                },
                {
                  value: "semester",
                  label:
                    dictionary?.marketing?.onboarding?.pricing?.perSemester ||
                    "Per Semester",
                },
                {
                  value: "annual",
                  label:
                    dictionary?.marketing?.onboarding?.pricing?.annual ||
                    "Annual",
                },
              ].map(({ value, label }) => (
                <div key={value} className="flex items-center gap-2">
                  <RadioGroupItem value={value} id={`schedule-${value}`} />
                  <Label htmlFor={`schedule-${value}`}>{label}</Label>
                </div>
              ))}
            </RadioGroup>
          </FormField>
        </div>

        {/* Price Preview */}
        <div className="bg-muted/50 rounded-lg p-6">
          <h3 className="mb-4 text-lg font-medium">
            {dictionary?.marketing?.onboarding?.pricing?.feeBreakdown ||
              "Fee breakdown"}
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>
                {dictionary?.marketing?.onboarding?.pricing?.tuitionFeeLabel ||
                  "Tuition fee"}{" "}
                ({form.watch("paymentSchedule")})
              </span>
              <span>
                {form.watch("currency")} {form.watch("tuitionFee") || 0}
              </span>
            </div>
            {(form.watch("registrationFee") || 0) > 0 && (
              <div className="flex justify-between">
                <span>
                  {dictionary?.marketing?.onboarding?.pricing
                    ?.registrationFeeLabel || "Registration fee"}{" "}
                  (
                  {dictionary?.marketing?.onboarding?.pricing?.oneTime ||
                    "one-time"}
                  )
                </span>
                <span>
                  {form.watch("currency")} {form.watch("registrationFee")}
                </span>
              </div>
            )}
            {(form.watch("applicationFee") || 0) > 0 && (
              <div className="flex justify-between">
                <span>
                  {dictionary?.marketing?.onboarding?.pricing
                    ?.applicationFeeLabel || "Application fee"}{" "}
                  (
                  {dictionary?.marketing?.onboarding?.pricing?.oneTime ||
                    "one-time"}
                  )
                </span>
                <span>
                  {form.watch("currency")} {form.watch("applicationFee")}
                </span>
              </div>
            )}
            <div className="mt-2 border-t pt-2">
              <div className="flex justify-between font-medium">
                <span>
                  {dictionary?.marketing?.onboarding?.pricing
                    ?.totalInitialPayment || "Total initial payment"}
                </span>
                <span>
                  {form.watch("currency")}{" "}
                  {(form.watch("tuitionFee") || 0) +
                    (form.watch("registrationFee") || 0) +
                    (form.watch("applicationFee") || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <StepNavigation
          onNext={onSubmit}
          onPrevious={onBack}
          isNextDisabled={!isFormValid || isLoading}
          nextLabel={
            isLoading
              ? dictionary?.marketing?.onboarding?.pricing?.saving ||
                "Saving..."
              : dictionary?.common?.next || "Next"
          }
          showPrevious={true}
        />
      </form>
    </StepWrapper>
  )
}
