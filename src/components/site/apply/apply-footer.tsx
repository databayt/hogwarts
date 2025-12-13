"use client";

import React from 'react';
import Image from 'next/image';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { HelpCircle, Bookmark, Loader2, Check } from 'lucide-react';
import { useApplyValidation } from './validation-context';
import { useApplication } from './application-context';
import { useLocale } from '@/components/internationalization/use-locale';
import { APPLY_STEPS, STEP_GROUPS, type ApplyStep } from './config.client';
import { formatRelativeTime } from '@/components/file';

interface ApplyFooterProps {
  dictionary?: Record<string, unknown>;
  locale?: string;
}

const ApplyFooter: React.FC<ApplyFooterProps> = ({
  dictionary,
  locale: propLocale
}) => {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const { isRTL: hookIsRTL, locale: hookLocale } = useLocale();
  const { session, saveSession } = useApplication();

  // Use prop locale if provided, otherwise use hook locale
  const locale = propLocale || hookLocale;
  const isRTL = locale === 'ar';

  // Use validation context if available
  let contextNextDisabled = false;
  let customNavigation: {
    onBack?: () => void;
    onNext?: () => void;
    nextDisabled?: boolean;
  } | undefined;

  try {
    const validationContext = useApplyValidation();
    contextNextDisabled = validationContext.isNextDisabled;
    customNavigation = validationContext.customNavigation;
  } catch {
    contextNextDisabled = false;
    customNavigation = undefined;
  }

  // Extract current step from pathname
  const getCurrentStepFromPath = (): number => {
    const pathSegments = pathname.split('/');
    const currentStepSlug = pathSegments[pathSegments.length - 1] as ApplyStep;
    const stepIndex = APPLY_STEPS.findIndex(step => step === currentStepSlug);
    return stepIndex === -1 ? 0 : stepIndex;
  };

  const currentStepIndex = getCurrentStepFromPath();
  const currentStepSlug = APPLY_STEPS[currentStepIndex] || APPLY_STEPS[0];
  const id = params.id as string;
  const subdomain = params.subdomain as string;

  // Determine which step group we're in
  const getCurrentStepGroup = (): number => {
    for (const [group, steps] of Object.entries(STEP_GROUPS)) {
      if (steps.includes(currentStepSlug)) {
        return parseInt(group);
      }
    }
    return 1;
  };

  const currentStepGroup = getCurrentStepGroup();

  // Navigation functions
  const handleBack = () => {
    if (customNavigation?.onBack) {
      customNavigation.onBack();
      return;
    }

    if (currentStepIndex > 0) {
      const prevStep = APPLY_STEPS[currentStepIndex - 1];
      router.push(`/${locale}/s/${subdomain}/apply/${id}/${prevStep}`);
    }
  };

  const handleNext = () => {
    if (customNavigation?.onNext) {
      customNavigation.onNext();
      return;
    }

    // If we're on the review step (last step), submit
    if (currentStepSlug === 'review') {
      // This will be handled by custom navigation in review content
      return;
    }

    if (currentStepIndex < APPLY_STEPS.length - 1) {
      const nextStep = APPLY_STEPS[currentStepIndex + 1];
      router.push(`/${locale}/s/${subdomain}/apply/${id}/${nextStep}`);
    }
  };

  const handleSave = async () => {
    await saveSession();
  };

  // Calculate progress for each step group
  const getStepProgress = (stepNumber: number): number => {
    if (currentStepGroup > stepNumber) return 100;
    if (currentStepGroup === stepNumber) {
      const groupSteps = STEP_GROUPS[stepNumber as keyof typeof STEP_GROUPS];
      const currentStepInGroup = groupSteps.findIndex(step => step === currentStepSlug);
      return Math.max(10, ((currentStepInGroup + 1) / groupSteps.length) * 100);
    }
    return 0;
  };

  // Access apply dictionary from admission.apply
  const applyDict = (dictionary as Record<string, Record<string, Record<string, unknown>>> | null)?.admission?.apply;
  const footerDict = (applyDict?.footer ?? {}) as Record<string, string>;
  const groupsDict = (applyDict?.groups ?? {}) as Record<string, string>;

  const isLastStep = currentStepSlug === 'review';
  const canGoBack = currentStepIndex > 0;
  const canGoNext = !contextNextDisabled && !(customNavigation?.nextDisabled);

  // Get step group labels from dictionary
  const stepLabels = [
    groupsDict.basicInfo || (isRTL ? 'المعلومات الأساسية' : 'Basic Information'),
    groupsDict.familyEducation || (isRTL ? 'العائلة والتعليم' : 'Family & Education'),
    groupsDict.finalize || (isRTL ? 'إنهاء' : 'Finalize'),
  ];

  const backLabel = footerDict.back || (isRTL ? 'السابق' : 'Back');
  const nextLabel = isLastStep
    ? (footerDict.submit || (isRTL ? 'تقديم الطلب' : 'Submit Application'))
    : (footerDict.next || (isRTL ? 'التالي' : 'Next'));
  const helpLabel = footerDict.help || (isRTL ? 'مساعدة' : 'Help');
  const saveLabel = footerDict.save || (isRTL ? 'حفظ' : 'Save');
  const savingLabel = footerDict.saving || (isRTL ? 'جاري الحفظ...' : 'Saving...');
  const lastSavedTemplate = footerDict.lastSaved || (isRTL ? 'آخر حفظ {time}' : 'Last saved {time}');

  // Format last saved time
  const lastSavedText = session.lastSaved
    ? lastSavedTemplate.replace('{time}', formatRelativeTime(session.lastSaved))
    : null;

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t">
      {/* Three separate progress bars - always LTR */}
      <div dir="ltr">
        <div className="grid grid-cols-3 gap-1 sm:gap-2 px-4 sm:px-6 md:px-12 lg:px-20">
          {stepLabels.map((label, index) => (
            <Progress
              key={index}
              value={getStepProgress(index + 1)}
              className="h-1 w-full"
            />
          ))}
        </div>
      </div>

      {/* All controls in one row */}
      <div className={`flex items-center justify-between px-4 sm:px-6 md:px-12 lg:px-20 py-3 sm:py-4 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Left side - Logo, Help, Save, Last Saved */}
        <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="relative w-6 h-6">
              <Image
                src="/logo.png"
                alt="Logo"
                fill
                sizes="24px"
                className="object-contain"
              />
            </div>
          </div>
          <Button
            variant="link"
            size="icon"
            className="rounded-full w-8 h-8 p-0 hover:bg-muted"
            aria-label={helpLabel}
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
          <Button
            variant="link"
            size="icon"
            onClick={handleSave}
            disabled={session.isSaving}
            className="rounded-full w-8 h-8 p-0 hover:bg-muted"
            aria-label={saveLabel}
          >
            {session.isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Bookmark className="h-5 w-5" />
            )}
          </Button>
          {/* Last Saved Indicator */}
          {lastSavedText && !session.isSaving && (
            <div className={`hidden sm:flex items-center gap-1 text-xs text-muted-foreground ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
              <Check className="h-3 w-3 text-green-500" />
              <span>{lastSavedText}</span>
            </div>
          )}
          {session.isSaving && (
            <span className="hidden sm:inline text-xs text-muted-foreground">
              {savingLabel}
            </span>
          )}
        </div>

        {/* Right side - Back and Next buttons */}
        <div className={`flex items-center gap-2 sm:gap-4 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={!canGoBack}
            size="sm"
          >
            {backLabel}
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canGoNext}
            size="sm"
          >
            {nextLabel}
          </Button>
        </div>
      </div>
    </footer>
  );
};

export default ApplyFooter;
