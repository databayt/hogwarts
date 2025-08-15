"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import  StepsOverview  from '@/components/onboarding/overview/steps-overview';

const OverviewPage = () => {
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
};

export default OverviewPage; 