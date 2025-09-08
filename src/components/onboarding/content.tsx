"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import SchoolOnboardingDashboard from './overview/host-dashboard';
import { useCurrentUser } from '@/components/auth/use-current-user';
import { ErrorBoundary } from './error-boundary';
import { getUserSchools, initializeSchoolSetup } from './actions';
import { Skeleton } from '@/components/ui/skeleton';

export default function OnboardingContent() {
  const router = useRouter();
  const user = useCurrentUser();
  const [isCreating, setIsCreating] = React.useState(false);
  const [schools, setSchools] = React.useState([]);
  const [totalSchools, setTotalSchools] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    loadUserSchools();
  }, []);

  const loadUserSchools = async () => {
    try {
      const response = await getUserSchools();
      if (response.success) {
        const data = response.data || { schools: [], totalCount: 0 };
        setSchools(data.schools || []);
        setTotalSchools(data.totalCount || 0);
      } else {
        console.error('Failed to load schools:', response.error);
      }
    } catch (error) {
      console.error('Failed to load schools:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchoolClick = (id: string) => {
    router.push(`/onboarding/${id}/about-school`);
  };

  const handleCreateNew = async () => {
    if (isCreating) return;
    
    setIsCreating(true);
    try {
      const response = await initializeSchoolSetup();
      if (response.success && response.data) {
        // Force a page refresh to ensure session is updated
        window.location.href = `/onboarding/overview?schoolId=${response.data.id}`;
      } else {
        console.error('Failed to create school:', response.error);
      }
    } catch (error) {
      console.error('Failed to create school:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateFromTemplate = () => {
    router.push('/onboarding/overview?template=true');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-xl mx-auto px-3 sm:px-4 space-y-3 sm:space-y-4">
          {/* Welcome Header skeleton */}
          <div>
            <Skeleton className="h-8 w-64 mb-3 sm:mb-4" />
          </div>
          
          {/* Schools skeleton */}
          <div className="space-y-2 sm:space-y-3">
            <Skeleton className="h-6 w-48" />
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="p-3 border rounded-lg space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          </div>
          
          {/* New school options skeleton */}
          <div className="space-y-2 sm:space-y-3">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="p-3 border rounded-lg space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex items-center justify-center">
        <SchoolOnboardingDashboard 
          userName={user?.name || "Admin"}
          schools={schools.map(school => ({
            id: school.id!,
            name: school.name || 'Unnamed School',
            startDate: school.createdAt ? new Date(school.createdAt).toLocaleDateString() : 'Unknown',
            status: school.isPublished ? 'active' : 'draft' as const,
            subdomain: school.domain,
          }))}
          totalSchools={totalSchools}
          onSchoolClick={handleSchoolClick}
          onCreateNew={handleCreateNew}
          onCreateFromTemplate={handleCreateFromTemplate}
        />
      </div>
    </ErrorBoundary>
  );
}


