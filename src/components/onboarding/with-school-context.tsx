"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SchoolContextWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that ensures proper school context for onboarding
 */
export function SchoolContextWrapper({ children }: SchoolContextWrapperProps) {
  const params = useParams();
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestedSchoolId = params.id as string;

  useEffect(() => {
    async function validateAndSetupContext() {
      if (!requestedSchoolId) {
        console.error("❌ No school ID in URL");
        router.push('/onboarding');
        return;
      }

      try {
        setIsValidating(true);
        setError(null);

        // Call API to validate school access
        const response = await fetch('/api/onboarding/validate-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ schoolId: requestedSchoolId }),
        });

        const result = await response.json();

        if (!result.success) {
          if (result.redirectTo) {
            console.log("🔄 Redirecting to correct school:", result.redirectTo);
            router.push(result.redirectTo);
          } else {
            setError(result.error || "Unable to access this school");
          }
          return;
        }

        // Context is valid, proceed with rendering
        console.log("✅ School context validated:", {
          schoolId: result.schoolId,
          schoolName: result.schoolName,
        });

      } catch (err) {
        console.error("❌ Error validating school context:", err);
        setError("Failed to validate school access");
      } finally {
        setIsValidating(false);
      }
    }

    validateAndSetupContext();
  }, [requestedSchoolId, router]);

  if (isValidating) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-sm text-muted-foreground">Validating school access...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4 text-center">
          <button
            onClick={() => router.push('/onboarding')}
            className="text-sm text-primary hover:underline"
          >
            Return to onboarding overview
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}