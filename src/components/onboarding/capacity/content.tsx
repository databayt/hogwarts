"use client";

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import { useCapacity } from './use-capacity';
import { CapacityForm } from './form';
import { CapacityCard } from './card';

export default function CapacityContent() {
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
          <div className="space-y-4">
            <div className="h-6 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
          </div>
          <div className="h-80 bg-muted animate-pulse rounded" />
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
              Share some basics
              <br />
              about your school
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Tell us about your school's capacity and facilities. These numbers will help us configure your system properly.
            </p>

            {/* Capacity preview card */}
            {capacityData && (
              <div className="mt-6">
                <CapacityCard 
                  studentCount={capacityData.studentCount}
                  teachers={capacityData.teachers}
                  classrooms={capacityData.classrooms}
                  facilities={capacityData.facilities}
                />
              </div>
            )}
          </div>

          {/* Right side - Form */}
          <div>
            <CapacityForm
              schoolId={schoolId}
              initialData={capacityData || undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}