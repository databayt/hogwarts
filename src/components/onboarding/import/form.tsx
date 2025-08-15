"use client"

import { useState } from 'react'
import { usePhotos } from './use-photos'
import { StepWrapper } from '../step-wrapper'
import { StepNavigation } from '../step-navigation'
import { FormField } from '../form-field'
import { X, Plus, Image } from 'lucide-react'

export function PhotosForm() {
  const { 
    form, 
    onSubmit, 
    onBack,
    photoUrls,
    addPhotoUrl,
    removePhoto,
    isLoading, 
    error, 
    isFormValid
  } = usePhotos()

  const [newPhotoUrl, setNewPhotoUrl] = useState('')

  const handleAddPhoto = () => {
    if (newPhotoUrl.trim()) {
      addPhotoUrl(newPhotoUrl.trim())
      setNewPhotoUrl('')
    }
  }

  const addSamplePhotos = () => {
    const sampleUrls = [
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
    ]
    
    sampleUrls.forEach(url => {
      if (photoUrls.length < 30) {
        addPhotoUrl(url)
      }
    })
  }

  return (
    <StepWrapper>
      <form onSubmit={onSubmit} className="space-y-8">
        <FormField
          label="Add some photos of your place"
          description="You'll need at least 1 photo to get started. You can add more or make changes later."
          error={form.formState.errors.photoUrls?.message}
        >
          <div className="space-y-4">
            {/* Add photo input */}
            <div className="flex gap-2">
              <input
                type="url"
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="flex-1 p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleAddPhoto}
                disabled={!newPhotoUrl.trim()}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Sample photos button */}
            <div className="text-center">
              <button
                type="button"
                onClick={addSamplePhotos}
                className="text-sm text-primary hover:underline"
              >
                Add sample photos for demo
              </button>
            </div>

            {/* Photo grid */}
            {photoUrls.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photoUrls.map((url, index) => (
                  <div key={index} className="relative group aspect-square">
                    <img
                      src={url}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NyA3NEgxMTNWODdIMTAwVjEwMEg4N1Y3NFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
                <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Add your first photo to get started
                </p>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              {photoUrls.length}/30 photos • {photoUrls.length >= 1 ? 'Ready to continue' : 'Add at least 1 photo'}
            </div>
          </div>
        </FormField>

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