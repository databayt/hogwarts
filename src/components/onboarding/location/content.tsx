"use client";

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import { useLocation } from './use-location';
import { LocationForm } from './form';
import { LocationCard } from './card';

export default function LocationContent() {
  const params = useParams();
  const schoolId = params.id as string;
  const { enableNext, disableNext } = useHostValidation();
  const { data: locationData, loading } = useLocation(schoolId);

  // Enable/disable next button based on form completion
  useEffect(() => {
    if (locationData?.address?.trim()) {
      enableNext();
    } else {
      disableNext();
    }
  }, [locationData, enableNext, disableNext]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-20 items-start">
          <div className="space-y-4">
            <div className="h-6 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
          </div>
          <div className="h-64 bg-muted animate-pulse rounded" />
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
              Where's your school
              <br />
              located?
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Your school's address will be visible to parents and staff members.
            </p>

            {/* Location preview card */}
            {locationData?.address && (
              <div className="mt-6">
                <LocationCard address={locationData.address} />
              </div>
            )}
          </div>

          {/* Right side - Form */}
          <div>
            <LocationForm
              schoolId={schoolId}
              initialData={locationData || undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
