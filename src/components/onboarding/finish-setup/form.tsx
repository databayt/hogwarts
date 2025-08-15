"use client"

import { useFinishSetup } from './use-finish-setup'
import { StepWrapper } from '../step-wrapper'
import { Check, AlertCircle, Clock } from 'lucide-react'

export function FinishSetupForm() {
  const { 
    listing,
    publishNow,
    saveDraft,
    isLoading,
    error,
    isPublished,
    canPublish,
    missingRequirements,
    isPublishing
  } = useFinishSetup()

  if (isPublished) {
    return (
      <StepWrapper>
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          
          <div>
            <h2 className="text-2xl font-medium mb-2">
              Congratulations! Your listing is now live
            </h2>
            <p className="text-muted-foreground">
              Guests can now discover and book your place.
            </p>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm">
              Redirecting to your host dashboard...
            </p>
          </div>
        </div>
      </StepWrapper>
    )
  }

  return (
    <StepWrapper>
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-medium mb-4">
            Review your listing
          </h2>
          <p className="text-muted-foreground">
            Here's what we'll show to guests. Make sure everything looks good.
          </p>
        </div>

        {/* Listing Summary */}
        {listing && (
          <div className="bg-muted/50 p-6 rounded-lg space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">
                  {listing.title || 'Untitled Listing'}
                </h3>
                <p className="text-muted-foreground">
                  {listing.propertyType} in {listing.city}, {listing.state}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-medium">
                  ${listing.pricePerNight || 0}/night
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Guests:</span> {listing.guestCount || 0}
              </div>
              <div>
                <span className="text-muted-foreground">Bedrooms:</span> {listing.bedrooms || 0}
              </div>
              <div>
                <span className="text-muted-foreground">Bathrooms:</span> {listing.bathrooms || 0}
              </div>
            </div>

            {listing.amenities && listing.amenities.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Amenities:</p>
                <div className="flex flex-wrap gap-2">
                  {listing.amenities.slice(0, 5).map((amenity) => (
                    <span key={amenity} className="px-2 py-1 bg-background rounded text-xs">
                      {amenity.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  ))}
                  {listing.amenities.length > 5 && (
                    <span className="text-xs text-muted-foreground">
                      +{listing.amenities.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Requirements Check */}
        {!canPublish && (
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-900 mb-2">
                  Complete these steps to publish
                </h4>
                <ul className="text-sm text-orange-800 space-y-1">
                  {missingRequirements.map((requirement) => (
                    <li key={requirement}>• {requirement}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={saveDraft}
            disabled={isLoading}
            className="flex-1 px-6 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              Save as draft
            </div>
          </button>

          <button
            onClick={publishNow}
            disabled={!canPublish || isLoading}
            className={`
              flex-1 px-6 py-3 rounded-lg font-medium transition-colors
              ${canPublish && !isLoading
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
              }
            `}
          >
            {isPublishing ? 'Publishing...' : 'Publish listing'}
          </button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          You can always edit your listing after publishing
        </div>
      </div>
    </StepWrapper>
  )
} 