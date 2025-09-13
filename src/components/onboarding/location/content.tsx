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
      <div className="max-w-3xl mx-auto">
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
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
    <div className="max-w-3xl mx-auto">
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-semibold">
            Where's your school located?
          </h3>
          <p className="text-muted-foreground mt-2">
            Your school's address will be visible to parents and staff members.
          </p>
        </div>

        <LocationForm
          schoolId={schoolId}
          initialData={locationData || undefined}
        />
      </div>
    </div>
  );
}