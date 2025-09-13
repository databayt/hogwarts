"use client"

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { locationSchema, type LocationFormData } from "./validation";
import { updateSchoolLocation } from "./actions";
import { MapForm } from "./map-form";
import { useHostValidation } from "../host-validation-context";

interface LocationFormProps {
  schoolId: string;
  initialData?: Partial<LocationFormData>;
  onSuccess?: () => void;
}

export function LocationForm({ schoolId, initialData, onSuccess }: LocationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [locationData, setLocationData] = useState<LocationFormData>({
    address: initialData?.address || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    country: initialData?.country || "",
    postalCode: initialData?.postalCode || "",
    latitude: initialData?.latitude,
    longitude: initialData?.longitude,
  });

  const { setCustomNavigation, enableNext, disableNext } = useHostValidation();

  // Enable/disable next button based on location selection
  useEffect(() => {
    if (locationData.address) {
      enableNext();
    } else {
      disableNext();
    }
  }, [locationData, enableNext, disableNext]);

  // Set up custom navigation to save on next
  useEffect(() => {
    const handleNext = () => {
      if (!locationData.address) {
        setError("Please select a location");
        return;
      }

      startTransition(async () => {
        try {
          setError("");
          
          // Validate the data
          const validatedData = locationSchema.parse(locationData);
          
          const result = await updateSchoolLocation(schoolId, validatedData);
          
          if (result.success) {
            onSuccess?.();
            // Navigate to next step
            router.push(`/onboarding/${schoolId}/stand-out`);
          } else {
            setError(result.error || "Failed to update location");
          }
        } catch (err: any) {
          if (err.errors) {
            setError("Please fill in all required fields");
          } else {
            setError("An unexpected error occurred");
          }
        }
      });
    };

    setCustomNavigation({
      onNext: handleNext,
      nextDisabled: isPending || !locationData.address
    });

    return () => {
      setCustomNavigation(undefined);
    };
  }, [locationData, schoolId, router, onSuccess, setCustomNavigation, isPending]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}
      
      <MapForm 
        initialData={initialData}
        onLocationChange={setLocationData}
      />
    </div>
  );
}