"use client";

import React from 'react';
import Image from 'next/image';
import HostStepHeader from '@/components/onboarding/step-header';
import { useHostValidation } from '@/components/onboarding/host-validation-context';

interface Props {
  dictionary?: any;
}

export default function StandOutContent({ dictionary }: Props) {
  const dict = dictionary?.onboarding || {};
  const { enableNext } = useHostValidation();

  // Enable next button for this informational page
  React.useEffect(() => {
    enableNext();
  }, [enableNext]);

  const illustration = (
    <div className="w-full sm:w-3/4 max-w-xl mx-auto rounded-xl sm:rounded-2xl flex items-center justify-center overflow-hidden h-[300px] sm:aspect-video relative">
      <Image
        src="/onboarding/stand-out.png"
        alt="Stand Out"
        fill
        className="object-contain"
        priority
      />
    </div>
  );

  return (
    <div className="">
      <div className="w-full">
        <HostStepHeader
          stepNumber={5}
          title={dict.whatMakesYourSchoolUnique || "What makes your school stand out?"}
          description={dict.uniqueFeaturesDescription || "Tell us about the unique features, programs, and qualities that make your school special and help it attract the right students and families."}
          illustration={illustration}
          dictionary={dictionary}
        />
      </div>
    </div>
  );
}
