"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import { useDescription } from './use-description';
import { DescriptionForm } from './form';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  dictionary?: any;
}

export default function DescriptionContent({ dictionary }: Props) {
  const params = useParams();
  const router = useRouter();
  const schoolId = params.id as string;
  const { enableNext, disableNext, setCustomNavigation } = useHostValidation();
  const { data: descriptionData, loading, refresh } = useDescription(schoolId);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const dict = dictionary?.onboarding || {};

  // Enable/disable next button based on school type selection
  useEffect(() => {
    // Default to 'private' if no data exists
    const currentType = selectedType || descriptionData?.schoolType || 'private';
    console.log("🟢 Enabling Next button - School type:", currentType);
    enableNext();

    // Set selectedType to 'private' if no data exists
    if (!selectedType && !descriptionData?.schoolType) {
      setSelectedType('private');
    }
  }, [selectedType, descriptionData?.schoolType, enableNext, disableNext]);

  // Set up custom navigation to handle the Next button
  useEffect(() => {
    const handleNext = () => {
      console.log("🔵 Description handleNext called - navigating to location");
      router.push(`/onboarding/${schoolId}/location`);
    };

    setCustomNavigation({
      onNext: handleNext
    });

    return () => {
      setCustomNavigation(undefined);
    };
  }, [schoolId, router, setCustomNavigation]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-20 items-start">
          {/* Left side - Text content skeleton */}
          <div className="space-y-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            
            {/* Preview card skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <div className="p-4 border rounded-lg space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          </div>
          
          {/* Right side - Form skeleton */}
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-40" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-20 items-start">
          {/* Left side - Text content */}
          <div className="space-y-3 sm:space-y-4">
            <h3>
              {dict.describeEducationModel || "Describe your school's"}
              <br />
              {dict.educationModel || "education model"}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              {dict.selectSchoolTypeDescription || "Select the type that best describes your school's educational approach and governance structure."}
            </p>
          </div>

          {/* Right side - Form */}
          <div>
            <DescriptionForm
              schoolId={schoolId}
              initialData={descriptionData || undefined}
              onTypeSelect={setSelectedType}
              onSuccess={() => refresh()}
              dictionary={dictionary}
            />
          </div>
        </div>
      </div>
    </div>
  );
}