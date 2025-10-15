"use client";

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocale } from '@/components/internationalization/use-locale';
import { type Locale } from '@/components/internationalization/config';
import { type Dictionary } from '@/components/internationalization/dictionaries';
import Image from 'next/image';

interface Step {
  number: number;
  title: string;
  description: string;
  illustration: string;
}

interface StepsOverviewClientProps {
  dictionary: Dictionary['school']['onboarding']['overview'];
  lang: Locale;
}

const StepsOverviewClient: React.FC<StepsOverviewClientProps> = ({ dictionary, lang }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCreating, setIsCreating] = React.useState(false);
  const { isRTL } = useLocale();

  const steps: Step[] = [
    {
      number: 1,
      title: dictionary.steps.step1.title,
      description: dictionary.steps.step1.description,
      illustration: "/onboarding/about-school.png"
    },
    {
      number: 2,
      title: dictionary.steps.step2.title,
      description: dictionary.steps.step2.description,
      illustration: "/onboarding/stand-out.png"
    },
    {
      number: 3,
      title: dictionary.steps.step3.title,
      description: dictionary.steps.step3.description,
      illustration: "/onboarding/finish-setup.png"
    }
  ];

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
      router.push(`/${lang}/onboarding/${schoolId}/about-school`);
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
            redirectTarget: `/${lang}/onboarding/${result.data.id}/about-school`,
            waitingBeforeRedirect: true,
            waitTime: '2000ms'
          });

          // Wait longer for the database update and session refresh to propagate
          await new Promise(resolve => setTimeout(resolve, 2000));

          console.log('🔄 [DEBUG] Executing redirect to about-school page:', {
            targetUrl: `/${lang}/onboarding/${result.data.id}/about-school`,
            redirectMethod: 'window.location.href',
            redirectTimestamp: new Date().toISOString()
          });

          // Force a full page refresh to ensure session is updated
          window.location.href = `/${lang}/onboarding/${result.data.id}/about-school`;
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
            redirectTarget: `/${lang}/onboarding/${tempId}/about-school`,
            fallbackTimestamp: new Date().toISOString()
          });
          router.push(`/${lang}/onboarding/${tempId}/about-school`);
        }
      } catch (error) {
        console.error('❌ [DEBUG] Exception in handleGetStarted:', error);
        // Fallback to temporary ID if there's an error
        const tempId = `draft-${Date.now()}`;
        console.log('🔄 [DEBUG] Exception fallback redirect to draft:', tempId);
        router.push(`/${lang}/onboarding/${tempId}/about-school`);
      } finally {
        console.log('🏁 [DEBUG] Setting isCreating to false');
        setIsCreating(false);
      }
    }
  };

  return (
    <div className={`h-full flex flex-col px-20 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex-1">
        <div className="h-full max-w-7xl mx-auto flex flex-col">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-12 items-start py-12">
            {/* Left Side - Title */}
            <div>
              <h2 className={`text-4xl font-bold ${isRTL ? 'text-right' : 'text-left'}`}>
                {dictionary.title}
              </h2>
            </div>

            {/* Right Side - Steps */}
            <div className="space-y-6">
              {steps.map((step) => (
                <div key={step.number} className={`flex gap-6 items-start ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex gap-3 flex-1 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="flex-shrink-0">
                      <h4 className="text-foreground">
                        {step.number}
                      </h4>
                    </div>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <h4 className="mb-1">
                        {step.title}
                      </h4>
                      <p>
                        {step.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 hidden md:block">
                    <div className="relative w-24 h-24 overflow-hidden">
                      <Image
                        src={step.illustration}
                        alt={step.title}
                        fill
                        sizes="96px"
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Section with HR and Button */}
          <div className="">
            <Separator className="w-full" />
            <div className={`flex py-4 ${isRTL ? 'justify-start' : 'justify-end'}`}>
              <Button onClick={handleGetStarted} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Skeleton className="w-4 h-4 mr-2" />
                    {dictionary.creatingSchool}
                  </>
                ) : (
                  dictionary.getStarted
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepsOverviewClient;