"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Upload, Palette, Square, Circle } from 'lucide-react';
import Image from 'next/image';
import { useListing } from '@/components/onboarding/use-listing';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function BrandingContent() {
  const router = useRouter();
  const params = useParams();
  const { setCustomNavigation } = useHostValidation();
  const { listing, updateListingData } = useListing();
  const [logo, setLogo] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState<string>('#0f172a'); // Default dark color
  const [borderRadius, setBorderRadius] = useState<'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'>('md');
  const [shadow, setShadow] = useState<'none' | 'sm' | 'md' | 'lg' | 'xl'>('md');

  // Get the ID from the URL params
  const id = params?.id as string;

  // Load existing data from listing
  useEffect(() => {
    if (listing) {
      if (listing.logo) setLogo(listing.logo);
      if (listing.primaryColor) setPrimaryColor(listing.primaryColor);
      if (listing.borderRadius) setBorderRadius(listing.borderRadius);
      if (listing.shadow) setShadow(listing.shadow);
    }
  }, [listing]);

  const handleBack = () => {
    router.push(`/onboarding/${id}/description`);
  };

  const handleNext = async () => {
    try {
      await updateListingData({
        logo,
        primaryColor,
        borderRadius,
        shadow
      });
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

  const colorOptions = [
    { id: 'slate', color: '#0f172a', name: 'Slate' },
    { id: 'blue', color: '#1d4ed8', name: 'Blue' },
    { id: 'green', color: '#15803d', name: 'Green' },
    { id: 'yellow', color: '#facc15', name: 'Yellow' },
    { id: 'orange', color: '#ea580c', name: 'Orange' },
    { id: 'rose', color: '#e11d48', name: 'Rose' },
    { id: 'purple', color: '#7e22ce', name: 'Purple' },
  ];

  const radiusOptions = [
    { id: 'none', label: 'no' },
    { id: 'sm', label: 'sm' },
    { id: 'md', label: 'md' },
    { id: 'lg', label: 'lg' },
  ];

  const shadowOptions = [
    { id: 'none', label: 'no' },
    { id: 'sm', label: 'sm' },
    { id: 'md', label: 'md' },
    { id: 'lg', label: 'lg' },
  ];

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
              Create your school's
              <br />
              brand identity
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Upload your logo and customize your school's visual style.
            </p>
          </div>

          {/* Style Controls */}
          <div className="space-y-5">
            {/* Color Selection */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium w-24">Color</label>
              <div className="flex gap-2">
                {colorOptions.map((option) => (
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
              <label className="text-sm font-medium w-24">Rounded</label>
              <div className="flex gap-2">
                {radiusOptions.map((option) => (
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
              <label className="text-sm font-medium w-24">Shadow</label>
              <div className="flex gap-2">
                {shadowOptions.map((option) => (
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
            {!logo ? (
              // Initial large upload box
              <div className={cn(
                "border border-dashed border-muted-foreground text-center bg-muted h-[300px] flex flex-col justify-center",
                {
                  'rounded-none': borderRadius === 'none',
                  'rounded-sm': borderRadius === 'sm',
                  'rounded-md': borderRadius === 'md',
                  'rounded-lg': borderRadius === 'lg',
                  'rounded-xl': borderRadius === 'xl',
                  'rounded-full': borderRadius === 'full',
                  'shadow-none': shadow === 'none',
                  'shadow-sm': shadow === 'sm',
                  'shadow-md': shadow === 'md',
                  'shadow-lg': shadow === 'lg',
                  'shadow-xl': shadow === 'xl',
                }
              )}>
                <div className="space-y-4">
                 

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Upload your school logo</p>
                    <p className="text-xs text-muted-foreground">
                      SVG, PNG, JPG (max. 800x800px)
                    </p>
                    <div className="flex flex-col items-center gap-1">
                      <Button
                        asChild
                        className={cn("mt-2", {
                          'rounded-none': borderRadius === 'none',
                          'rounded-sm': borderRadius === 'sm',
                          'rounded-md': borderRadius === 'md',
                          'rounded-lg': borderRadius === 'lg',
                          'rounded-xl': borderRadius === 'xl',
                          'rounded-full': borderRadius === 'full',
                          'shadow-none': shadow === 'none',
                          'shadow-sm': shadow === 'sm',
                          'shadow-md': shadow === 'md',
                          'shadow-lg': shadow === 'lg',
                          'shadow-xl': shadow === 'xl',
                        })}
                        style={{ 
                          backgroundColor: primaryColor,
                          '--theme-primary': primaryColor
                        } as React.CSSProperties}
                      >
                        <label htmlFor="logo-upload" className="cursor-pointer px-4 py-2">
                          Choose file
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
                        <p className="text-xs text-muted-foreground">
                          File selected
                        </p>
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
                    'rounded-lg': borderRadius === 'medium',
                    'rounded-full': borderRadius === 'full',
                    'shadow-none': shadow === 'none',
                    'shadow-md': shadow === 'medium',
                    'shadow-xl': shadow === 'large',
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
                    'rounded-xl': borderRadius === 'xl',
                    'rounded-full': borderRadius === 'full',
                    'shadow-none': shadow === 'none',
                    'shadow-sm': shadow === 'sm',
                    'shadow-md': shadow === 'md',
                    'shadow-lg': shadow === 'lg',
                    'shadow-xl': shadow === 'xl',
                  })}
                  onClick={() => setLogo(null)}
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
