"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import SchoolOnboardingDashboard from './overview/host-dashboard';
import { useCurrentUser } from '@/components/auth/use-current-user';

export default function OnboardingContent() {
  const router = useRouter();
  const user = useCurrentUser();
  const [isCreating, setIsCreating] = React.useState(false);

  const handleSchoolClick = (id: string) => {
    router.push(`/onboarding/${id}/about-place`);
  };

  const handleCreateNew = async () => {
    if (isCreating) return;
    setIsCreating(true);
    router.push('/onboarding/overview');
    setIsCreating(false);
  };

  const handleCreateFromTemplate = () => {
    console.log('Create from template');
    // TODO: Implement template selection logic
    router.push('/onboarding/overview?template=true');
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <SchoolOnboardingDashboard 
        userName={user?.name || "Admin"}
        onSchoolClick={handleSchoolClick}
        onCreateNew={handleCreateNew}
        onCreateFromTemplate={handleCreateFromTemplate}
      />
    </div>
  );
}


