"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Phone } from 'lucide-react';
import { useLocale } from '@/components/internationalization/use-locale';
import { useApplyValidation } from '../validation-context';
import { useApplication } from '../application-context';
import { ContactForm } from './form';
import { CONTACT_STEP_CONFIG } from './config';
import type { ContactFormRef } from './types';
import type { ContactStepData } from '../types';

interface Props {
  dictionary?: Record<string, unknown>;
}

export default function ContactContent({ dictionary }: Props) {
  const params = useParams();
  const router = useRouter();
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  const subdomain = params.subdomain as string;
  const campaignId = params.campaignId as string;

  const { enableNext, disableNext, setCustomNavigation } = useApplyValidation();
  const { session, getStepData } = useApplication();
  const contactFormRef = useRef<ContactFormRef>(null);

  const initialData = getStepData('contact');

  const onNext = useCallback(async () => {
    if (contactFormRef.current) {
      try {
        await contactFormRef.current.saveAndNext();
        router.push(`/${locale}/apply/${campaignId}/guardian`);
      } catch (error) {
        console.error('Error saving contact step:', error);
      }
    }
  }, [locale, subdomain, campaignId, router]);

  useEffect(() => {
    const contactData = session.formData.contact;

    const isValid =
      contactData?.email &&
      contactData?.phone &&
      contactData?.address &&
      contactData?.city &&
      contactData?.state &&
      contactData?.country;

    if (isValid) {
      enableNext();
      setCustomNavigation({ onNext });
    } else {
      disableNext();
      setCustomNavigation(undefined);
    }
  }, [session.formData.contact, enableNext, disableNext, setCustomNavigation, onNext]);

  const dict = ((dictionary as Record<string, Record<string, string>> | null)?.apply?.contact ?? {}) as Record<string, string>;

  return (
    <div className="space-y-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Phone className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {dict.title || (isRTL ? CONTACT_STEP_CONFIG.labelAr : CONTACT_STEP_CONFIG.label)}
            </h1>
            <p className="text-muted-foreground mt-1">
              {dict.description || (isRTL ? CONTACT_STEP_CONFIG.descriptionAr : CONTACT_STEP_CONFIG.description)}
            </p>
          </div>
        </div>

        <ContactForm
          ref={contactFormRef}
          initialData={initialData as ContactStepData}
          dictionary={dictionary}
        />
      </div>
    </div>
  );
}
