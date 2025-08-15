"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import { useListing } from '@/components/onboarding/use-listing';
import { useHostValidation } from '@/components/onboarding/host-validation-context';

export default function ImportContent() {
  const { enableNext } = useHostValidation();
  const { listing, updateListingData } = useListing();
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Load existing photos from listing
  React.useEffect(() => {
    if (listing?.photoUrls) {
      setUploadedPhotos(listing.photoUrls);
    }
  }, [listing]);

  // Enable next button since photos are optional
  React.useEffect(() => {
    enableNext();
  }, [enableNext]);

  const uploadFileToCloudinary = async (file: File): Promise<string> => {
    // For now, create a local object URL as a fallback
    return URL.createObjectURL(file);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      
      try {
        const newPhotos: string[] = [];
        
        for (const file of Array.from(files)) {
          const photoUrl = await uploadFileToCloudinary(file);
          newPhotos.push(photoUrl);
        }
        
        const updatedPhotos = [...uploadedPhotos, ...newPhotos];
        setUploadedPhotos(updatedPhotos);
        
        // Update backend
        await updateListingData({
          photoUrls: updatedPhotos
        });
        
      } catch (error) {
        console.error('Error uploading photos:', error);
      } finally {
        setIsUploading(false);
      }
    }
    
    // Reset input
    event.target.value = '';
  };

  const handleSingleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      
      try {
        const photoUrl = await uploadFileToCloudinary(file);
        const updatedPhotos = [...uploadedPhotos, photoUrl];
        setUploadedPhotos(updatedPhotos);
        
        // Update backend
        await updateListingData({
          photoUrls: updatedPhotos
        });
        
      } catch (error) {
        console.error('Error uploading photo:', error);
      } finally {
        setIsUploading(false);
      }
    }
    
    // Reset input
    event.target.value = '';
  };

  const removePhoto = async (index: number) => {
    const updatedPhotos = uploadedPhotos.filter((_, i) => i !== index);
    setUploadedPhotos(updatedPhotos);
    
    // Update backend
    try {
      await updateListingData({
        photoUrls: updatedPhotos
      });
    } catch (error) {
      console.error('Error removing photo:', error);
    }
  };

  const renderUploadBoxes = () => {
    const boxes = [];
    const maxPhotos = 9; // Allow more photos since we're using 3 per row
    
    // Render uploaded photos
    for (let i = 0; i < uploadedPhotos.length; i++) {
      boxes.push(
        <div
          key={`photo-${i}`}
          className="border border-solid border-foreground rounded-lg bg-muted h-[100px] sm:h-[140px]"
        >
          <div className="relative w-full h-full group">
            <Image
              src={uploadedPhotos[i]}
              alt={`Photo ${i + 1}`}
              fill
              className="object-cover rounded-lg"
            />
            <button
              onClick={() => removePhoto(i)}
              className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        </div>
      );
    }
    
    // Add the "add button" box if we haven't reached max photos
    if (uploadedPhotos.length < maxPhotos) {
      boxes.push(
        <div
          key="add-button"
          className="border border-dashed border-muted-foreground rounded-lg bg-muted h-[100px] sm:h-[140px]"
        >
          <div className="w-full h-full flex flex-col items-center justify-center">
            <label
              htmlFor="photo-upload-add"
              className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-muted-foreground/10 transition-colors"
            >
              <Plus size={24} className="text-muted-foreground" />
            </label>
            <input
              id="photo-upload-add"
              type="file"
              accept="image/*"
              onChange={handleSingleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
          </div>
        </div>
      );
    }
    
    return boxes;
  };

  return (
    <div className="">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-20 items-start">
          {/* Left side - Text content */}
          <div className="space-y-3 sm:space-y-4">
            <h3>
              Import your student data
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Upload your student records in Excel or CSV format. We'll help you map the columns.
            </p>
          </div>
          
          {/* Right side - Upload boxes */}
          <div>
            {uploadedPhotos.length === 0 ? (
              // Initial large upload box
              <div className="border border-dashed border-muted-foreground rounded-lg text-center bg-muted h-[200px] sm:h-[300px] flex flex-col justify-center">
                <div className="">
                  <div className="relative w-20 h-20 sm:w-32 sm:h-32 mx-auto">
                    <Image
                      src="/airbnb/camera.avif"
                      alt="Upload"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="photo-upload"
                    className="inline-block px-3 py-1.5 border border-foreground rounded-md bg-background hover:bg-accent cursor-pointer transition-colors text-sm sm:text-base"
                  >
                    {isUploading ? 'Uploading...' : 'Upload file'}
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              // Grid of files
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {renderUploadBoxes()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
