"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { User } from 'lucide-react';
import { useLocale } from '@/components/internationalization/use-locale';
import { useApplyValidation } from '../validation-context';
import { useApplication } from '../application-context';
import { PersonalForm } from './form';
import { PERSONAL_STEP_CONFIG } from './config';
import type { PersonalFormRef } from './types';
import type { PersonalStepData } from '../types';

interface Props {
  dictionary?: Record<string, unknown>;
}

export default function PersonalContent({ dictionary }: Props) {
  const params = useParams();
  const router = useRouter();
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  const subdomain = params.subdomain as string;
  const id = params.id as string;

  const { enableNext, disableNext, setCustomNavigation } = useApplyValidation();
  const { session, getStepData } = useApplication();
  const personalFormRef = useRef<PersonalFormRef>(null);

  const initialData = getStepData('personal');

  const onNext = useCallback(async () => {
    if (personalFormRef.current) {
      try {
        await personalFormRef.current.saveAndNext();
        router.push(`/${locale}/s/${subdomain}/apply/${id}/contact`);
      } catch (error) {
        console.error('Error saving personal step:', error);
      }
    }
  }, [locale, subdomain, id, router]);

  // Enable/disable next button based on form validity
  useEffect(() => {
    const personalData = session.formData.personal;

    // Check if required fields are filled
    const isValid =
      personalData?.firstName &&
      personalData?.lastName &&
      personalData?.dateOfBirth &&
      personalData?.gender &&
      personalData?.nationality;

    if (isValid) {
      enableNext();
      setCustomNavigation({ onNext });
    } else {
      disableNext();
      setCustomNavigation(undefined);
    }
  }, [session.formData.personal, enableNext, disableNext, setCustomNavigation, onNext]);

  const dict = ((dictionary as Record<string, Record<string, string>> | null)?.apply?.personal ?? {}) as Record<string, string>;

  return (
    <div className="space-y-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {dict.title || (isRTL ? PERSONAL_STEP_CONFIG.labelAr : PERSONAL_STEP_CONFIG.label)}
            </h1>
            <p className="text-muted-foreground mt-1">
              {dict.description || (isRTL ? PERSONAL_STEP_CONFIG.descriptionAr : PERSONAL_STEP_CONFIG.description)}
            </p>
          </div>
        </div>

        {/* Form */}
        <PersonalForm
          ref={personalFormRef}
          initialData={initialData as PersonalStepData}
          dictionary={dictionary}
        />
      </div>
    </div>
  );
}
