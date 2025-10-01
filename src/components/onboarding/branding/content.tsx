"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Upload, Palette, Square, Circle } from 'lucide-react';
import Image from 'next/image';
import { useListing } from '@/components/onboarding/use-listing';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { COLOR_OPTIONS, RADIUS_OPTIONS, SHADOW_OPTIONS } from './constants';

interface BrandingContentProps {
  dictionary?: any;
}

export default function BrandingContent({ dictionary }: BrandingContentProps) {
  const dict = dictionary?.onboarding || {};
  const router = useRouter();
  const params = useParams();
  const { setCustomNavigation } = useHostValidation();
  const { listing, updateListingData } = useListing();
  const [logo, setLogo] = useState<string>();
  const [primaryColor, setPrimaryColor] = useState<string>('#0f172a'); // Default dark color
  const [borderRadius, setBorderRadius] = useState<'none' | 'sm' | 'md' | 'lg'>('md');
  const [shadow, setShadow] = useState<'none' | 'sm' | 'md' | 'lg'>('md');

  // Get the ID from the URL params
  const id = params?.id as string;

  // Load existing data from listing
  useEffect(() => {
    if (listing) {
      if (listing.logoUrl !== undefined && listing.logoUrl !== null) setLogo(listing.logoUrl);
      if (listing.primaryColor) setPrimaryColor(listing.primaryColor);
      if (listing.borderRadius && ['none', 'sm', 'md', 'lg'].includes(listing.borderRadius)) {
        setBorderRadius(listing.borderRadius as 'none' | 'sm' | 'md' | 'lg');
      }
      if (listing.shadow && ['none', 'sm', 'md', 'lg'].includes(listing.shadow)) {
        setShadow(listing.shadow as 'none' | 'sm' | 'md' | 'lg');
      }
    }
  }, [listing]);

  const handleBack = () => {
    router.push(`/onboarding/${id}/description`);
  };

  const handleNext = async () => {
    try {
      // Save the data silently without affecting UI loading state
      updateListingData({
        logoUrl: logo,
        primaryColor,
        borderRadius,
        shadow
      });
      // Navigate immediately without waiting for the save to complete
      router.push(`/onboarding/${id}/import`);
    } catch (error) {
      console.error('Error updating branding:', error);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Set custom navigation in context
  useEffect(() => {
    setCustomNavigation({
      onBack: handleBack,
      onNext: handleNext,
      nextDisabled: !logo
    });

    return () => {
      setCustomNavigation(undefined);
    };
  }, [logo]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-20 items-start">
        {/* Left side - Text content and controls */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h3>
              {dict.schoolBranding || "Create your school's"}
              <br />
              {dict.brandIdentity || "brand identity"}
            </h3>
            <p className="muted sm:text-base text-muted-foreground">
              {dict.brandingDescription || "Upload your logo and customize your school's visual style."}
            </p>
          </div>

          {/* Style Controls */}
          <div className="space-y-5">
            {/* Color Selection */}
            <div className="flex items-center gap-4">
              <label className="font-medium w-24"><small>{dict.color || "Color"}</small></label>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setPrimaryColor(option.color)}
                    className={cn(
                      "w-6 h-6 rounded-full transition-all",
                      primaryColor === option.color ? "ring-2 ring-offset-2 ring-foreground" : ""
                    )}
                    style={{ backgroundColor: option.color }}
                    title={option.name}
                  />
                ))}
              </div>
            </div>

            <div className="h-[0.5px] w-80 bg-border/50" />

            {/* Border Radius Selection */}
            <div className="flex items-center gap-4">
              <label className="font-medium w-24"><small>{dict.rounded || "Rounded"}</small></label>
              <div className="flex gap-2">
                {RADIUS_OPTIONS.map((option) => (
                  <Button
                    key={option.id}
                    onClick={() => setBorderRadius(option.id as any)}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "px-2 min-w-[40px] w-[40px] text-xs transition-all",
                      borderRadius === option.id 
                        ? "border-2 border-foreground bg-background opacity-100" 
                        : "opacity-70 hover:opacity-90"
                    )}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="h-[0.5px] w-80 bg-border/50" />

            {/* Shadow Selection */}
            <div className="flex items-center gap-4">
              <label className="font-medium w-24"><small>{dict.shadow || "Shadow"}</small></label>
              <div className="flex gap-2">
                {SHADOW_OPTIONS.map((option) => (
                  <Button
                    key={option.id}
                    onClick={() => setShadow(option.id as any)}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "px-2 min-w-[40px] w-[40px] text-xs transition-all",
                      shadow === option.id 
                        ? "border-2 border-foreground bg-background opacity-100" 
                        : "opacity-70 hover:opacity-90"
                    )}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

                  {/* Right side - Logo Upload and Preview */}
          <div>
            {logo === undefined ? (
              // Initial large upload box
              <div className={cn(
                "border border-dashed border-muted-foreground text-center bg-muted h-[300px] flex flex-col justify-center",
                {
                  'rounded-none': borderRadius === 'none',
                  'rounded-sm': borderRadius === 'sm',
                  'rounded-md': borderRadius === 'md',
                  'rounded-lg': borderRadius === 'lg',
                  'shadow-none': shadow === 'none',
                  'shadow-sm': shadow === 'sm',
                  'shadow-md': shadow === 'md',
                  'shadow-lg': shadow === 'lg',
                }
              )}>
                <div className="space-y-4">


                  <div className="space-y-2">
                    <h6>{dict.uploadSchoolLogo || "Upload your school logo"}</h6>
                    <small className="block text-muted-foreground">
                      {dict.logoFileTypes || "SVG, PNG, JPG (max. 800x800px)"}
                    </small>
                    <div className="flex flex-col items-center gap-1">
                      <Button
                        asChild
                        className={cn("mt-2", {
                                            'rounded-none': borderRadius === 'none',
                  'rounded-sm': borderRadius === 'sm',
                  'rounded-md': borderRadius === 'md',
                  'rounded-lg': borderRadius === 'lg',
                  'shadow-none': shadow === 'none',
                  'shadow-sm': shadow === 'sm',
                  'shadow-md': shadow === 'md',
                  'shadow-lg': shadow === 'lg',
                        })}
                        style={{ 
                          backgroundColor: primaryColor,
                          '--theme-primary': primaryColor
                        } as React.CSSProperties}
                      >
                        <label htmlFor="logo-upload" className="cursor-pointer px-4 py-2">
                          {dict.chooseFile || "Choose file"}
                        </label>
                      </Button>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      {logo && (
                        <small className="text-muted-foreground">
                          {dict.fileSelected || "File selected"}
                        </small>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Logo preview
                              <div
                className={cn(
                  "border border-dashed border-muted-foreground rounded-lg h-[300px] relative overflow-hidden",
                  {
                    'rounded-none': borderRadius === 'none',
                    'rounded-sm': borderRadius === 'sm',
                    'rounded-md': borderRadius === 'md',
                    'rounded-lg': borderRadius === 'lg',
                    'shadow-none': shadow === 'none',
                    'shadow-sm': shadow === 'sm',
                    'shadow-md': shadow === 'md',
                    'shadow-lg': shadow === 'lg',
                  }
                )}
              >
                <Image
                  src={logo}
                  alt="School logo"
                  fill
                  className="object-contain p-4"
                />
                <Button
                  size="icon"
                  className={cn("absolute top-2 right-2", {
                    'rounded-none': borderRadius === 'none',
                    'rounded-sm': borderRadius === 'sm',
                    'rounded-md': borderRadius === 'md',
                    'rounded-lg': borderRadius === 'lg',
                    'shadow-none': shadow === 'none',
                    'shadow-sm': shadow === 'sm',
                    'shadow-md': shadow === 'md',
                    'shadow-lg': shadow === 'lg',
                  })}
                  onClick={() => setLogo(undefined)}
                  style={{ 
                    backgroundColor: primaryColor,
                    '--theme-primary': primaryColor
                  } as React.CSSProperties}
                >
                  ×
                </Button>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
