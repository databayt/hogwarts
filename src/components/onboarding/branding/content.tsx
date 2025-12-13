"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useListing } from '@/components/onboarding/use-listing';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import { Button } from "@/components/ui/button";
import { FileUploader, ACCEPT_IMAGES, type UploadedFileResult } from "@/components/file";
import { Upload, X } from 'lucide-react';

interface Props {
  dictionary?: any;
}

export default function BrandingContent({ dictionary }: Props) {
  const dict = dictionary?.onboarding || {};
  const router = useRouter();
  const params = useParams();
  const { setCustomNavigation, enableNext } = useHostValidation();
  const { listing, updateListingData } = useListing();
  const [logo, setLogo] = useState<string>();
  const [showUploader, setShowUploader] = useState(false);

  const id = params?.id as string;

  // Load existing logo from listing
  useEffect(() => {
    if (listing?.logoUrl) {
      setLogo(listing.logoUrl);
    }
  }, [listing]);

  // Always enable next (logo is optional)
  useEffect(() => {
    enableNext();
  }, [enableNext]);

  const handleNext = async () => {
    try {
      if (logo) {
        updateListingData({ logoUrl: logo });
      }
      router.push(`/onboarding/${id}/import`);
    } catch (error) {
      console.error('Error updating branding:', error);
    }
  };

  const handleUploadComplete = (files: UploadedFileResult[]) => {
    if (files.length > 0) {
      const uploadedFile = files[0];
      const logoUrl = uploadedFile.cdnUrl || uploadedFile.url;
      setLogo(logoUrl);
      setShowUploader(false);
      updateListingData({ logoUrl });
    }
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
  };

  const handleRemoveLogo = () => {
    setLogo(undefined);
    updateListingData({ logoUrl: undefined });
  };

  // Set custom navigation
  useEffect(() => {
    setCustomNavigation({
      onNext: handleNext
    });

    return () => {
      setCustomNavigation(undefined);
    };
  }, [logo]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
        {/* Left side - Text content */}
        <div className="space-y-3 sm:space-y-4">
          <h1 className="text-3xl font-bold">
            {dict.schoolBranding || "Upload your school logo"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {dict.brandingDescription || "Add your school's logo to personalize your platform. This is optional - you can always add it later."}
          </p>
        </div>

        {/* Right side - Simple Logo Upload */}
        <div className="lg:justify-self-end">
          {!logo && !showUploader ? (
            <div
              onClick={() => setShowUploader(true)}
              className="border-2 border-dashed border-muted-foreground/30 rounded-lg h-[250px] w-[400px] flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
            >
              <Upload className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="font-medium">{dict.uploadLogo || "Upload logo"}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {dict.logoFileTypes || "SVG, PNG, JPG"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {dict.optional || "(Optional)"}
              </p>
            </div>
          ) : showUploader ? (
            <div className="space-y-4 w-[400px]">
              <FileUploader
                category="IMAGE"
                folder="school-logos"
                accept={ACCEPT_IMAGES}
                maxFiles={1}
                multiple={false}
                maxSize={5 * 1024 * 1024}
                optimizeImages={true}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
              />
              <Button
                variant="outline"
                onClick={() => setShowUploader(false)}
                className="w-full"
              >
                {dict.cancel || "Cancel"}
              </Button>
            </div>
          ) : (
            <div className="relative h-[250px] w-[400px] border rounded-lg overflow-hidden">
              {logo && (
                <Image
                  src={logo}
                  alt="School logo"
                  fill
                  className="object-contain p-4"
                />
              )}
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={handleRemoveLogo}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
