"use client"

import { usePrice } from './use-price'
import { StepWrapper } from '../step-wrapper'
import { StepNavigation } from '../step-navigation'
import { FormField } from '../form-field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

export function PriceForm() {
  const { 
    form, 
    onSubmit, 
    onBack,
    isLoading, 
    error, 
    isFormValid,
  } = usePrice()

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
              <span className="absolute start-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <input
                type="number"
                min="0"
                step="1"
                {...form.register('tuitionFee', { valueAsNumber: true })}
                className="w-full ps-8 pe-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
              <span className="absolute start-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <input
                type="number"
                min="0"
                step="1"
                {...form.register('registrationFee', { valueAsNumber: true })}
                className="w-full ps-8 pe-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
              <span className="absolute start-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <input
                type="number"
                min="0"
                step="1"
                {...form.register('applicationFee', { valueAsNumber: true })}
                className="w-full ps-8 pe-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
              defaultValue={form.getValues('currency')}
              onValueChange={(value: string) => form.setValue('currency', value as 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD')}
              className="grid grid-cols-2 sm:grid-cols-3 gap-4"
            >
              {['USD', 'EUR', 'GBP', 'CAD', 'AUD'].map((currency) => (
                <div key={currency} className="flex items-center space-x-2">
                  <RadioGroupItem value={currency} id={`currency-${currency}`} />
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
              defaultValue={form.getValues('paymentSchedule')}
              onValueChange={(value: string) => form.setValue('paymentSchedule', value as 'monthly' | 'quarterly' | 'semester' | 'annual')}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { value: 'monthly', label: 'Monthly' },
                { value: 'quarterly', label: 'Quarterly' },
                { value: 'semester', label: 'Per Semester' },
                { value: 'annual', label: 'Annual' },
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
        <div className="bg-muted/50 p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Fee breakdown</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Tuition fee ({form.watch('paymentSchedule')})</span>
              <span>{form.watch('currency')} {form.watch('tuitionFee') || 0}</span>
            </div>
            {(form.watch('registrationFee') || 0) > 0 && (
              <div className="flex justify-between">
                <span>Registration fee (one-time)</span>
                <span>{form.watch('currency')} {form.watch('registrationFee')}</span>
              </div>
            )}
            {(form.watch('applicationFee') || 0) > 0 && (
              <div className="flex justify-between">
                <span>Application fee (one-time)</span>
                <span>{form.watch('currency')} {form.watch('applicationFee')}</span>
              </div>
            )}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-medium">
                <span>Total initial payment</span>
                <span>
                  {form.watch('currency')} {
                    (form.watch('tuitionFee') || 0) +
                    (form.watch('registrationFee') || 0) +
                    (form.watch('applicationFee') || 0)
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <StepNavigation
          onNext={onSubmit}
          onPrevious={onBack}
          isNextDisabled={!isFormValid || isLoading}
          nextLabel={isLoading ? 'Saving...' : 'Next'}
          showPrevious={true}
        />
      </form>
    </StepWrapper>
  )
}