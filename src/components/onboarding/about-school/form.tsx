"use client"

import { useAboutPlace } from './use-about-place'
import { PROPERTY_TYPE_OPTIONS } from '../constants'
import { PropertySelector } from '../property-selector'
import { StepWrapper } from '../step-wrapper'
import { StepNavigation } from '../step-navigation'
import { FormField } from '../form-field'

export function AboutPlaceForm() {
  const { 
    form, 
    onSubmit, 
    isLoading, 
    error, 
    isFormValid, 
    selectedPropertyType 
  } = useAboutPlace()

  return (
    <StepWrapper>
      <form onSubmit={onSubmit} className="space-y-8">
        <FormField
          label="What type of place will you host?"
          error={form.formState.errors.propertyType?.message}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PROPERTY_TYPE_OPTIONS.map((option) => (
              <PropertySelector
                key={option.id}
                title={option.title}
                description={option.description}
                isSelected={selectedPropertyType === option.id}
                onClick={() => form.setValue('propertyType', option.id, { shouldValidate: true })}
              />
            ))}
          </div>
        </FormField>

        {error && (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <StepNavigation
          onNext={onSubmit}
          isNextDisabled={!isFormValid || isLoading}
          nextLabel={isLoading ? 'Saving...' : 'Next'}
          showPrevious={false}
        />
      </form>
    </StepWrapper>
  )
} 