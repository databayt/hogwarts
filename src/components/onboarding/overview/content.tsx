"use client";

import { useRouter, useParams } from 'next/navigation';
import { StepsOverview } from '@/components/onboarding';

export default function OnboardingOverviewContent() {
  const router = useRouter();
  const params = useParams();
  const schoolId = params.id as string;

  const handleGetStarted = async () => {
    // Navigate to the first step with the existing school ID
    router.push(`/onboarding/${schoolId}/about-school`);
  };

  return (
    <div className="h-screen overflow-hidden">
      <StepsOverview onGetStarted={handleGetStarted} />
    </div>
  );
}
