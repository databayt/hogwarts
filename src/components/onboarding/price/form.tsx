"use client"

import { usePrice } from './use-price'
import { StepWrapper } from '../step-wrapper'
import { StepNavigation } from '../step-navigation'
import { FormField } from '../form-field'

export function PriceForm() {
  const { 
    form, 
    onSubmit, 
    onBack,
    isLoading, 
    error, 
    isFormValid,
    pricePerNight,
    securityDeposit,
    applicationFee
  } = usePrice()

  return (
    <StepWrapper>
      <form onSubmit={onSubmit} className="space-y-8">
        <div className="space-y-6">
          <FormField
            label="Base price per night"
            description="This is your base price. You can adjust it for specific dates or seasons."
            error={form.formState.errors.pricePerNight?.message}
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <input
                type="number"
                min="10"
                max="10000"
                step="1"
                {...form.register('pricePerNight', { valueAsNumber: true })}
                className="w-full pl-8 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="50"
              />
            </div>
          </FormField>

          <FormField
            label="Security deposit (optional)"
            description="A refundable amount to cover potential damages."
            error={form.formState.errors.securityDeposit?.message}
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <input
                type="number"
                min="0"
                step="1"
                {...form.register('securityDeposit', { valueAsNumber: true })}
                className="w-full pl-8 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="0"
              />
            </div>
          </FormField>

          <FormField
            label="Application fee (optional)"
            description="A one-time fee for processing applications."
            error={form.formState.errors.applicationFee?.message}
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <input
                type="number"
                min="0"
                step="1"
                {...form.register('applicationFee', { valueAsNumber: true })}
                className="w-full pl-8 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="0"
              />
            </div>
          </FormField>
        </div>

        {/* Price Preview */}
        <div className="bg-muted/50 p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Price breakdown</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Base price per night</span>
              <span>${pricePerNight || 0}</span>
            </div>
            {securityDeposit > 0 && (
              <div className="flex justify-between">
                <span>Security deposit</span>
                <span>${securityDeposit}</span>
              </div>
            )}
            {applicationFee > 0 && (
              <div className="flex justify-between">
                <span>Application fee</span>
                <span>${applicationFee}</span>
              </div>
            )}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-medium">
                <span>Total for 1 night</span>
                <span>${(pricePerNight || 0) + (securityDeposit || 0) + (applicationFee || 0)}</span>
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