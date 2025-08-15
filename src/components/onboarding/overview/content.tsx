"use client";

import { useRouter } from 'next/navigation';
import { StepsOverview } from '@/components/onboarding';

export default function OnboardingOverviewContent() {
  const router = useRouter();

  const handleGetStarted = async () => {
    // Temporary navigation without creating a DB record
    const tempId = `draft-${Date.now()}`;
    router.push(`/onboarding/${tempId}/about-school`);
  };

  return (
    <div className="h-screen overflow-hidden">
      <StepsOverview onGetStarted={handleGetStarted} />
    </div>
  );
}
