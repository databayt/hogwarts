"use client";

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import  StepsOverview  from '@/components/onboarding/overview/steps-overview';

const OverviewPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCreating, setIsCreating] = React.useState(false);

  const handleGetStarted = async () => {
    const startTimestamp = new Date().toISOString();
    console.log('🚀 [DEBUG] handleGetStarted called', {
      startTimestamp,
      currentIsCreating: isCreating,
      location: 'overview-page'
    });
    
    if (isCreating) {
      console.log('⚠️ [DEBUG] Already creating, ignoring click', {
        isCreating,
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    console.log('🔄 [DEBUG] Setting isCreating to true', {
      previousState: isCreating,
      timestamp: new Date().toISOString()
    });
    setIsCreating(true);
    
    // Check if we have a real school ID from query params or sessionStorage
    const schoolIdFromParams = searchParams.get('schoolId');
    const schoolIdFromSession = sessionStorage.getItem('currentSchoolId');
    const schoolId = schoolIdFromParams || schoolIdFromSession;
    console.log('🔍 [DEBUG] School ID sources:', {
      fromParams: schoolIdFromParams,
      fromSession: schoolIdFromSession,
      final: schoolId
    });
    
    if (schoolId) {
      console.log('✅ [DEBUG] Using existing schoolId, redirecting...');
      // Use the real school ID that was just created
      router.push(`/onboarding/${schoolId}/about-school`);
    } else {
      console.log('🏗️ [DEBUG] No schoolId, creating new school...');
      // Create a new school record first
      try {
        console.log('📦 [DEBUG] Importing initializeSchoolSetup...');
        const { initializeSchoolSetup } = await import('@/components/onboarding/actions');
        
        console.log('🏗️ [DEBUG] Calling initializeSchoolSetup...');
        const result = await initializeSchoolSetup();
        
        console.log('📋 [DEBUG] initializeSchoolSetup result:', {
          success: result.success,
          hasData: !!result.data,
          schoolId: result.data?.id,
          schoolName: result.data?.name,
          error: result.error,
          resultTimestamp: new Date().toISOString()
        });
        
        if (result.success && result.data) {
          console.log('✅ [DEBUG] School created successfully, preparing redirect:', {
            schoolId: result.data.id,
            schoolName: result.data.name,
            redirectTarget: `/onboarding/${result.data.id}/about-school`,
            waitingBeforeRedirect: true,
            waitTime: '2000ms'
          });
          
          // Wait longer for the database update and session refresh to propagate
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          console.log('🔄 [DEBUG] Executing redirect to about-school page:', {
            targetUrl: `/onboarding/${result.data.id}/about-school`,
            redirectMethod: 'window.location.href',
            redirectTimestamp: new Date().toISOString()
          });
          
          // Force a full page refresh to ensure session is updated
          window.location.href = `/onboarding/${result.data.id}/about-school`;
        } else {
          console.error('❌ [DEBUG] Failed to create school:', {
            error: result.error,
            success: result.success,
            hasData: !!result.data,
            errorTimestamp: new Date().toISOString()
          });
          
          // Fallback to temporary ID if school creation fails
          const tempId = `draft-${Date.now()}`;
          console.log('🔄 [DEBUG] Using fallback draft redirect:', {
            tempId,
            redirectTarget: `/onboarding/${tempId}/about-school`,
            fallbackTimestamp: new Date().toISOString()
          });
          router.push(`/onboarding/${tempId}/about-school`);
        }
      } catch (error) {
        console.error('❌ [DEBUG] Exception in handleGetStarted:', error);
        // Fallback to temporary ID if there's an error
        const tempId = `draft-${Date.now()}`;
        console.log('🔄 [DEBUG] Exception fallback redirect to draft:', tempId);
        router.push(`/onboarding/${tempId}/about-school`);
      } finally {
        console.log('🏁 [DEBUG] Setting isCreating to false');
        setIsCreating(false);
      }
    }
  };

  return (
    <div className="h-screen overflow-hidden">
      <StepsOverview onGetStarted={handleGetStarted} isLoading={isCreating} />
    </div>
  );
};

export default OverviewPage; 