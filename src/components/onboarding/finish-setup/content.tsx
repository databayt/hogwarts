"use client";

import React, { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import HostStepHeader from '@/components/onboarding/step-header';
import { Button } from '@/components/ui/button';

interface Props {
  dictionary?: any;
}

export default function FinishSetupContent({ dictionary }: Props) {
  const dict = dictionary?.onboarding || {};
  const router = useRouter();
  const { enableNext } = useHostValidation();

  // Enable next button for this step
  useEffect(() => {
    enableNext();
  }, [enableNext]);

  const illustration = (
    <div className="w-full sm:w-3/4 max-w-xl mx-auto rounded-xl sm:rounded-2xl flex items-center justify-center overflow-hidden h-[200px] relative">
      <Image
        src="https://www-cdn.anthropic.com/images/4zrzovbb/website/0321b0ecbbf53535e93be1310ae1935157bcebdd-1000x1000.svg"
        alt="Finish Setup"
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
          stepNumber={3}
          title={dict.finishSetup || "Finish setup"}
          description={dict.finishSetupDescription || "Review your school setup and complete the onboarding process."}
          illustration={illustration}
          dictionary={dictionary}
        />

      </div>
    </div>
  );
}