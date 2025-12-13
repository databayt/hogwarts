"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { useLocale } from '@/components/internationalization/use-locale';
import { useApplyValidation } from '../validation-context';
import { useApplication } from '../application-context';
import { DocumentsForm } from './form';
import { DOCUMENTS_STEP_CONFIG } from './config';
import type { DocumentsFormRef } from './types';
import type { DocumentsStepData } from '../types';

interface Props {
  dictionary?: Record<string, unknown>;
}

export default function DocumentsContent({ dictionary }: Props) {
  const params = useParams();
  const router = useRouter();
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  const subdomain = params.subdomain as string;
  const id = params.id as string;

  const { enableNext, disableNext, setCustomNavigation } = useApplyValidation();
  const { session, getStepData } = useApplication();
  const documentsFormRef = useRef<DocumentsFormRef>(null);

  const initialData = getStepData('documents');

  const onNext = useCallback(async () => {
    if (documentsFormRef.current) {
      try {
        await documentsFormRef.current.saveAndNext();
        router.push(`/${locale}/s/${subdomain}/apply/${id}/review`);
      } catch (error) {
        console.error('Error saving documents step:', error);
      }
    }
  }, [locale, subdomain, id, router]);

  useEffect(() => {
    // Documents step is optional, always enable next
    enableNext();
    setCustomNavigation({ onNext });
  }, [enableNext, setCustomNavigation, onNext]);

  const dict = ((dictionary as Record<string, Record<string, string>> | null)?.apply?.documents ?? {}) as Record<string, string>;

  return (
    <div className="space-y-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {dict.title || (isRTL ? DOCUMENTS_STEP_CONFIG.labelAr : DOCUMENTS_STEP_CONFIG.label)}
            </h1>
            <p className="text-muted-foreground mt-1">
              {dict.description || (isRTL ? DOCUMENTS_STEP_CONFIG.descriptionAr : DOCUMENTS_STEP_CONFIG.description)}
            </p>
          </div>
        </div>

        <DocumentsForm
          ref={documentsFormRef}
          initialData={initialData as DocumentsStepData}
          dictionary={dictionary}
        />
      </div>
    </div>
  );
}
