"use client"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import { FormField } from "../form-field"
import { StepNavigation } from "../step-navigation"
import { StepWrapper } from "../step-wrapper"
import { usePrice } from "./use-price"

export function PriceForm() {
  const { form, onSubmit, onBack, isLoading, error, isFormValid } = usePrice()

  return (
    <StepWrapper>
      <form onSubmit={onSubmit} className="space-y-8">
        <div className="space-y-6">
          <FormField
            label="Tuition Fee"
            description="The base tuition fee for students."
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
            label="Registration Fee (optional)"
            description="A one-time fee for new student registration."
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
            label="Application Fee (optional)"
            description="A fee for processing student applications."
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
            label="Currency"
            description="Select your preferred currency."
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
                <div key={currency} className="flex items-center space-x-2">
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
            label="Payment Schedule"
            description="Choose how often payments are collected."
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
                { value: "monthly", label: "Monthly" },
                { value: "quarterly", label: "Quarterly" },
                { value: "semester", label: "Per Semester" },
                { value: "annual", label: "Annual" },
              ].map(({ value, label }) => (
                <div key={value} className="flex items-center space-x-2">
                  <RadioGroupItem value={value} id={`schedule-${value}`} />
                  <Label htmlFor={`schedule-${value}`}>{label}</Label>
                </div>
              ))}
            </RadioGroup>
          </FormField>
        </div>

        {/* Price Preview */}
        <div className="bg-muted/50 rounded-lg p-6">
          <h3 className="mb-4 text-lg font-medium">Fee breakdown</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Tuition fee ({form.watch("paymentSchedule")})</span>
              <span>
                {form.watch("currency")} {form.watch("tuitionFee") || 0}
              </span>
            </div>
            {(form.watch("registrationFee") || 0) > 0 && (
              <div className="flex justify-between">
                <span>Registration fee (one-time)</span>
                <span>
                  {form.watch("currency")} {form.watch("registrationFee")}
                </span>
              </div>
            )}
            {(form.watch("applicationFee") || 0) > 0 && (
              <div className="flex justify-between">
                <span>Application fee (one-time)</span>
                <span>
                  {form.watch("currency")} {form.watch("applicationFee")}
                </span>
              </div>
            )}
            <div className="mt-2 border-t pt-2">
              <div className="flex justify-between font-medium">
                <span>Total initial payment</span>
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
          nextLabel={isLoading ? "Saving..." : "Next"}
          showPrevious={true}
        />
      </form>
    </StepWrapper>
  )
}
