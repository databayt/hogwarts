"use client";

import React from 'react';
import Image from 'next/image';
import HostStepHeader from '@/components/onboarding/step-header';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  dictionary?: any;
}

export default function AboutSchoolContent({ dictionary }: Props) {
  const dict = dictionary?.onboarding || {};
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const { enableNext } = useHostValidation();

  // Enable next button for this informational page
  React.useEffect(() => {
    enableNext();
  }, [enableNext]);

  const illustration = (
    <div className="w-full sm:w-3/4 max-w-xl mx-auto bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl sm:rounded-2xl flex items-center justify-center overflow-hidden h-[300px] sm:aspect-video relative">
      {!imageLoaded && (
        <Skeleton className="absolute inset-0 w-full h-full rounded-xl sm:rounded-2xl" />
      )}
      <Image
        src="/onboarding/about-school.png"
        alt="About School"
        fill
        className="object-contain p-8"
        onLoad={() => setImageLoaded(true)}
        priority
      />
    </div>
  );

  return (
    <div className="">
      <div className="w-full">
        <HostStepHeader
          stepNumber={1}
          title={dict.tellUsAboutYourSchool || "Tell us about your school"}
          description={dict.aboutSchoolDescription || "In this step, we'll ask you about your school type, location, and student capacity. Then we'll help you set up your academic structure."}
          illustration={illustration}
          dictionary={dictionary}
        />
      </div>
    </div>
  );
}
