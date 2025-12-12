"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import { useLocale } from '@/components/internationalization/use-locale';
import { useApplyValidation } from '../validation-context';
import { useApplication } from '../application-context';
import { GuardianForm } from './form';
import { GUARDIAN_STEP_CONFIG } from './config';
import type { GuardianFormRef } from './types';
import type { GuardianStepData } from '../types';

interface Props {
  dictionary?: Record<string, unknown>;
}

export default function GuardianContent({ dictionary }: Props) {
  const params = useParams();
  const router = useRouter();
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  const subdomain = params.subdomain as string;
  const campaignId = params.campaignId as string;

  const { enableNext, disableNext, setCustomNavigation } = useApplyValidation();
  const { session, getStepData } = useApplication();
  const guardianFormRef = useRef<GuardianFormRef>(null);

  const initialData = getStepData('guardian');

  const onNext = useCallback(async () => {
    if (guardianFormRef.current) {
      try {
        await guardianFormRef.current.saveAndNext();
        router.push(`/${locale}/apply/${campaignId}/academic`);
      } catch (error) {
        console.error('Error saving guardian step:', error);
      }
    }
  }, [locale, subdomain, campaignId, router]);

  useEffect(() => {
    const guardianData = session.formData.guardian;

    // Father and mother names are required
    const isValid = guardianData?.fatherName && guardianData?.motherName;

    if (isValid) {
      enableNext();
      setCustomNavigation({ onNext });
    } else {
      disableNext();
      setCustomNavigation(undefined);
    }
  }, [session.formData.guardian, enableNext, disableNext, setCustomNavigation, onNext]);

  const dict = ((dictionary as Record<string, Record<string, string>> | null)?.apply?.guardian ?? {}) as Record<string, string>;

  return (
    <div className="space-y-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {dict.title || (isRTL ? GUARDIAN_STEP_CONFIG.labelAr : GUARDIAN_STEP_CONFIG.label)}
            </h1>
            <p className="text-muted-foreground mt-1">
              {dict.description || (isRTL ? GUARDIAN_STEP_CONFIG.descriptionAr : GUARDIAN_STEP_CONFIG.description)}
            </p>
          </div>
        </div>

        <GuardianForm
          ref={guardianFormRef}
          initialData={initialData as GuardianStepData}
          dictionary={dictionary}
        />
      </div>
    </div>
  );
}
