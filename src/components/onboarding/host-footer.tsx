"use client";

import React from 'react';
import Image from 'next/image';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { HelpCircle, Bookmark } from 'lucide-react';
import { useHostValidation } from './host-validation-context';

interface HostFooterProps {
  onBack?: () => void;
  onNext?: () => void;
  onHelp?: () => void;
  onSave?: () => void;
  currentStep?: number; // 1, 2, or 3
  backLabel?: string;
  nextLabel?: string;
  canGoBack?: boolean;
  canGoNext?: boolean;
  nextDisabled?: boolean;
}

// Define the step order for the hosting flow
const HOSTING_STEPS = [
  
  'about-school',
  'title',
  'description',
  'location',
  'stand-out',
  'capacity',
  'branding',
  'import',
  'finish-setup',
  'join',
  'visibility',
  'price',
  'discount',
  'legal'
];

// Group steps into 3 main categories
const STEP_GROUPS = {
  1: ['about-school', 'title', 'description', 'location', 'stand-out'],
  2: ['capacity', 'branding', 'import', 'finish-setup'],
  3: ['join', 'visibility', 'price', 'discount', 'legal']
};

const HostFooter: React.FC<HostFooterProps> = ({
  onBack,
  onNext,
  onHelp,
  onSave,
  currentStep: propCurrentStep,
  backLabel = "Back",
  nextLabel = "Next",
  canGoBack = true,
  canGoNext = true,
  nextDisabled = false
}) => {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  
  // Use validation context if available
  let contextNextDisabled = false;
  let customNavigation;
  try {
    const validationContext = useHostValidation();
    contextNextDisabled = validationContext.isNextDisabled;
    customNavigation = validationContext.customNavigation;
  } catch (error) {
    // Context not available, use default value
    contextNextDisabled = false;
    customNavigation = undefined;
  }
  
  // Extract current step from pathname
  const getCurrentStepFromPath = () => {
    const pathSegments = pathname.split('/');
    const currentStepSlug = pathSegments[pathSegments.length - 1];
    const stepIndex = HOSTING_STEPS.findIndex(step => step === currentStepSlug);
    return stepIndex === -1 ? 0 : stepIndex; // Default to first step if not found
  };
  
  const currentStepIndex = getCurrentStepFromPath();
  const currentStepSlug = HOSTING_STEPS[currentStepIndex] || HOSTING_STEPS[0];
  
  // Determine which step group we're in
  const getCurrentStepGroup = () => {
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
    // Use custom navigation if available
    if (customNavigation?.onBack) {
      customNavigation.onBack();
      return;
    }
    
    if (onBack) {
      onBack();
      return;
    }
    
    if (currentStepIndex > 0) {
      const prevStep = HOSTING_STEPS[currentStepIndex - 1];
      router.push(`/onboarding/${params.id}/${prevStep}`);
    }
  };
  
  const handleNext = () => {
    console.log("🔵 [HOST FOOTER] handleNext called", {
      hasCustomNavigation: !!customNavigation?.onNext,
      hasOnNext: !!onNext,
      currentStepSlug,
      currentStepIndex,
      schoolId: params.id,
      timestamp: new Date().toISOString()
    });
    
    // Use custom navigation if available
    if (customNavigation?.onNext) {
      console.log("🔷 [HOST FOOTER] Using custom navigation onNext");
      customNavigation.onNext();
      return;
    }
    
    if (onNext) {
      console.log("🔶 [HOST FOOTER] Using prop onNext");
      onNext();
      return;
    }
    
    // If we're on the legal step (last step), navigate to listings
    if (currentStepSlug === 'legal') {
      console.log("🏁 [HOST FOOTER] Last step - navigating to dashboard");
      router.push('/dashboard');
      return;
    }
    
    if (currentStepIndex < HOSTING_STEPS.length - 1) {
      const nextStep = HOSTING_STEPS[currentStepIndex + 1];
      console.log("➡️ [HOST FOOTER] Default navigation to next step", {
        from: currentStepSlug,
        to: nextStep,
        url: `/onboarding/${params.id}/${nextStep}`
      });
      router.push(`/onboarding/${params.id}/${nextStep}`);
    } else {
      console.warn("⚠️ [HOST FOOTER] No navigation action taken");
    }
  };
  
  // Calculate progress for each step group
  const getStepProgress = (stepNumber: number) => {
    if (currentStepGroup > stepNumber) return 100; // Completed
    if (currentStepGroup === stepNumber) {
      // Calculate progress within current group
      const groupSteps = STEP_GROUPS[stepNumber as keyof typeof STEP_GROUPS];
      const currentStepInGroup = groupSteps.findIndex(step => step === currentStepSlug);
      // Add 1 to currentStepInGroup to make it 1-indexed, so the last step shows 100%
      return Math.max(10, ((currentStepInGroup + 1) / groupSteps.length) * 100);
    }
    return 0; // Not started
  };
  
  const stepLabels = [
    "Tell us about your place",
    "Make it stand out", 
    "Finish up and publish"
  ];
  
  // Check if back/next are available
  const canGoBackActual = canGoBack && (currentStepIndex > 0);
  const canGoNextActual = canGoNext && (currentStepIndex < HOSTING_STEPS.length - 1 || currentStepSlug === 'legal') && !nextDisabled && !contextNextDisabled && !(customNavigation?.nextDisabled);
  
  // Debug logging for next button state
  console.log("🔍 [HOST FOOTER] Next button state:", {
    canGoNext,
    nextDisabled,
    contextNextDisabled,
    customNavigationDisabled: customNavigation?.nextDisabled,
    canGoNextActual,
    currentStepSlug,
    currentStepIndex
  });
  
  // Set the next button label based on current step
  const actualNextLabel = currentStepSlug === 'legal' ? 'Create school' : nextLabel;

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white">
      {/* Three separate progress bars */}
      <div className="">
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
      <div className="flex items-center justify-between px-4 sm:px-6 md:px-12 lg:px-20 py-3 sm:py-4">
        {/* Left side - Logo, Help, Save */}
        <div className="flex items-center">
          <div className="relative w-5 h-5">
            <Image
              src="/logo.png"
              alt="Tent icon"
              fill
              sizes="20px"
              className="object-contain"
            />
          </div>
          <Button
            variant="link"
            size="icon"
            onClick={onHelp}
            className="rounded-full ml-2 w-10 h-10 sm:w-10 sm:h-10"
          >
            <HelpCircle className="h-5 w-5 sm:h-10 sm:w-10" />
          </Button>
          <Button
            variant="link"
            size="icon"
            onClick={onSave}
            className="rounded-full w-10 h-10 sm:w-10 sm:h-10"
          >
            <Bookmark className="h-5 w-5 sm:h-10 sm:w-10" />
          </Button>
        </div>

        {/* Right side - Back and Next buttons */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={!canGoBackActual}
            size='sm'
            
          >
            {backLabel}
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canGoNextActual}
            size='sm'
            className=""
          >
            {actualNextLabel}
          </Button>
        </div>
      </div>
    </footer>
  );
};

export default HostFooter;
