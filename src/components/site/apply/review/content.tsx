"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useLocale } from '@/components/internationalization/use-locale';
import { useApplyValidation } from '../validation-context';
import { useApplication } from '../application-context';
import { ReviewForm } from './form';
import { REVIEW_STEP_CONFIG } from './config';
import type { ReviewFormRef } from './types';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  dictionary?: Record<string, unknown>;
}

export default function ReviewContent({ dictionary }: Props) {
  const params = useParams();
  const router = useRouter();
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  const subdomain = params.subdomain as string;

  const { enableNext, disableNext, setCustomNavigation } = useApplyValidation();
  const { session } = useApplication();
  const reviewFormRef = useRef<ReviewFormRef>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dict = ((dictionary as Record<string, Record<string, string>> | null)?.apply?.review ?? {}) as Record<string, string>;

  const onNext = useCallback(async () => {
    if (!reviewFormRef.current) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await reviewFormRef.current.submitApplication();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
      setIsSubmitting(false);
    }
  }, []);

  const handleSuccess = useCallback((applicationNumber: string) => {
    // Navigate to success page with application number
    router.push(`/${locale}/s/${subdomain}/apply/success?applicationNumber=${applicationNumber}`);
  }, [locale, subdomain, router]);

  useEffect(() => {
    // Check if all required steps are filled
    const { personal, contact, guardian, academic } = session.formData;

    const isComplete =
      personal?.firstName &&
      personal?.lastName &&
      contact?.email &&
      contact?.phone &&
      guardian?.fatherName &&
      guardian?.motherName &&
      academic?.applyingForClass;

    if (isComplete && !isSubmitting) {
      enableNext();
      setCustomNavigation({ onNext });
    } else {
      disableNext();
      setCustomNavigation(undefined);
    }
  }, [session.formData, isSubmitting, enableNext, disableNext, setCustomNavigation, onNext]);

  return (
    <div className="space-y-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            {isSubmitting ? (
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            ) : (
              <CheckCircle className="w-6 h-6 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {dict.title || (isRTL ? REVIEW_STEP_CONFIG.labelAr : REVIEW_STEP_CONFIG.label)}
            </h1>
            <p className="text-muted-foreground mt-1">
              {dict.description || (isRTL ? REVIEW_STEP_CONFIG.descriptionAr : REVIEW_STEP_CONFIG.description)}
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <ReviewForm
          ref={reviewFormRef}
          dictionary={dictionary}
          onSuccess={handleSuccess}
        />

        {/* Submit Notice */}
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            {dict.submitNotice || (isRTL
              ? 'بالنقر على "تقديم الطلب"، أقر بأن جميع المعلومات المقدمة صحيحة ودقيقة.'
              : 'By clicking "Submit Application", I confirm that all information provided is true and accurate.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
