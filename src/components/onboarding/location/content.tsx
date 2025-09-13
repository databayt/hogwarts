"use client";

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import { useLocation } from './use-location';
import { LocationForm } from './form';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LocationContent() {
  const params = useParams();
  const schoolId = params.id as string;
  const { enableNext, disableNext } = useHostValidation();
  const { data: locationData, loading, error } = useLocation(schoolId);

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
          {/* Left side - Text content skeleton */}
          <div className="space-y-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          
          {/* Right side - Form skeleton */}
          <div className="space-y-6">
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-20 items-start">
          {/* Left side - Text content */}
          <div className="space-y-3 sm:space-y-4">
            <h3>Where's your school located?</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Your school's address will be visible to parents and staff members.
            </p>
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