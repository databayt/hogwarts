"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import { useDescription } from './use-description';
import { DescriptionForm } from './form';
import { DescriptionCard } from './card';

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
          <div className="space-y-4">
            <div className="h-6 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
          </div>
          <div className="h-96 bg-muted animate-pulse rounded" />
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