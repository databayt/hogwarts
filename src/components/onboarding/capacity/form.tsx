"use client"

import { useFloorPlan } from '../floor-plan/use-floor-plan'
import { StepWrapper } from '../step-wrapper'
import { StepNavigation } from '../step-navigation'
import { FormField } from '../form-field'
import { Counter } from '../../atom/counter'

export function FloorPlanForm() {
  const { 
    form, 
    onSubmit, 
    onBack,
    increment,
    decrement,
    isLoading, 
    error, 
    isFormValid, 
    bedrooms,
    bathrooms,
    guestCount
  } = useFloorPlan()

  return (
    <StepWrapper>
      <form onSubmit={onSubmit} className="space-y-8">
        <div className="space-y-6">
          <FormField
            label="Bedrooms"
            description="How many bedrooms can guests use?"
          >
            <Counter
              value={bedrooms}
              onIncrement={() => increment('bedrooms')}
              onDecrement={() => decrement('bedrooms')}
              min={0}
              max={50}
            />
          </FormField>

          <FormField
            label="Bathrooms"
            description="How many bathrooms can guests use?"
          >
            <Counter
              value={bathrooms}
              onIncrement={() => increment('bathrooms')}
              onDecrement={() => decrement('bathrooms')}
              min={0.5}
              max={50}
              step={0.5}
            />
          </FormField>

          <FormField
            label="Guests"
            description="How many guests can your place accommodate?"
          >
            <Counter
              value={guestCount}
              onIncrement={() => increment('guestCount')}
              onDecrement={() => decrement('guestCount')}
              min={1}
              max={50}
            />
          </FormField>
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