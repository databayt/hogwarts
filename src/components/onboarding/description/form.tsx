"use client"

import { useDescription } from './use-description'
import { StepWrapper } from '../step-wrapper'
import { StepNavigation } from '../step-navigation'
import { FormField } from '../form-field'

export function DescriptionForm() {
  const { 
    form, 
    onSubmit, 
    onBack,
    isLoading, 
    error, 
    isFormValid,
    description,
    characterCount,
    remainingCharacters
  } = useDescription()

  return (
    <StepWrapper>
      <form onSubmit={onSubmit} className="space-y-8">
        <FormField
          label="Create your description"
          description="Share what makes your place special."
          error={form.formState.errors.description?.message}
        >
          <textarea
            {...form.register('description')}
            placeholder="Describe your space, what makes it unique, what guests will love about it, and what's nearby..."
            rows={8}
            className="w-full p-4 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
          
          <div className="flex justify-between items-center mt-2">
            <div className="text-sm text-muted-foreground">
              <div className="space-y-1">
                <div>• Mention what makes your place special</div>
                <div>• Describe the space and amenities</div>
                <div>• Highlight the neighborhood</div>
              </div>
            </div>
            <div className={`text-sm ${remainingCharacters < 50 ? 'text-orange-600' : 'text-muted-foreground'}`}>
              {characterCount}/500
            </div>
          </div>
        </FormField>

        {/* Description Preview */}
        {description && (
          <div className="bg-muted/50 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Preview</h3>
            <div className="bg-white p-4 rounded border">
              <p className="text-sm leading-relaxed">{description}</p>
            </div>
          </div>
        )}

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