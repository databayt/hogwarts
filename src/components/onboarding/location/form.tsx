"use client"

import { useLocation } from './use-location'
import { StepWrapper } from '../step-wrapper'
import { StepNavigation } from '../step-navigation'
import { FormField } from '../form-field'
import { Input } from '@/components/ui/input'

export function LocationForm() {
  const { 
    form, 
    onSubmit, 
    onBack,
    isLoading, 
    error, 
    isFormValid
  } = useLocation()

  return (
    <StepWrapper>
      <form onSubmit={onSubmit} className="space-y-8">
        <div className="space-y-6">
          <FormField
            label="Street address"
            error={form.formState.errors.address?.message}
          >
            <Input
              {...form.register('address')}
              placeholder="123 Main Street"
              className="h-10"
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="City"
              error={form.formState.errors.city?.message}
            >
              <Input
                {...form.register('city')}
                placeholder="New York"
                className="h-10"
              />
            </FormField>

            <FormField
              label="State/Province"
              error={form.formState.errors.state?.message}
            >
              <Input
                {...form.register('state')}
                placeholder="NY"
                className="h-10"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Country"
              error={form.formState.errors.country?.message}
            >
              <Input
                {...form.register('country')}
                placeholder="United States"
                className="h-10"
              />
            </FormField>

            <FormField
              label="Postal code"
              error={form.formState.errors.postalCode?.message}
            >
              <Input
                {...form.register('postalCode')}
                placeholder="10001"
                className="h-10"
              />
            </FormField>
          </div>
        </div>

        {error && (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </form>
    </StepWrapper>
  )
} 