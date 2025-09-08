"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import { useDescription } from './use-description';
import { DescriptionForm } from './form';
import { DescriptionCard } from './card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DescriptionContent() {
  const params = useParams();
  const schoolId = params.id as string;
  const { enableNext, disableNext } = useHostValidation();
  const { data: descriptionData, loading } = useDescription(schoolId);

  // Enable/disable next button based on form completion
  useEffect(() => {
    if (descriptionData?.schoolLevel && descriptionData?.schoolType) {
      enableNext();
    } else {
      disableNext();
    }
  }, [descriptionData, enableNext, disableNext]);

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
          {/* Left side - Text content and preview */}
          <div className="space-y-3 sm:space-y-4">
            <h3>
              Describe your school's
              <br />
              education model
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Help us understand what type of school you're setting up and the grade levels you serve.
            </p>

            {/* Description preview card */}
            {(descriptionData?.schoolLevel || descriptionData?.schoolType) && (
              <div className="mt-6">
                <DescriptionCard 
                  schoolLevel={descriptionData?.schoolLevel} 
                  schoolType={descriptionData?.schoolType} 
                />
              </div>
            )}
          </div>

          {/* Right side - Form */}
          <div>
            <DescriptionForm
              schoolId={schoolId}
              initialData={descriptionData || undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}