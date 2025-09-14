"use client";

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import { useCapacity } from './use-capacity';
import { CapacityForm } from './form';
import { Skeleton } from '@/components/ui/skeleton';

interface CapacityContentProps {
  dictionary?: any;
}

export default function CapacityContent({ dictionary }: CapacityContentProps) {
  const dict = dictionary?.onboarding || {};
  const params = useParams();
  const schoolId = params.id as string;
  const { enableNext, disableNext } = useHostValidation();
  const { data: capacityData, loading } = useCapacity(schoolId);

  // Enable/disable next button based on form completion
  useEffect(() => {
    if (capacityData?.studentCount && capacityData?.teachers) {
      enableNext();
    } else {
      disableNext();
    }
  }, [capacityData, enableNext, disableNext]);

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
              <div className="p-4 border rounded-lg space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
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
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
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
              {dict.howManyStudents || "Share some basics"}
              <br />
              {dict.aboutYourSchool || "about your school"}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              {dict.capacityDescription || "Tell us about your school's capacity and facilities. These numbers will help us configure your system properly."}
            </p>

          </div>

          {/* Right side - Form */}
          <div>
            <CapacityForm
              schoolId={schoolId}
              initialData={capacityData || undefined}
              dictionary={dictionary}
            />
          </div>
        </div>
      </div>
    </div>
  );
}