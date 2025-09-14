"use client";

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import HostStepHeader from '@/components/onboarding/step-header';
import { Button } from '@/components/ui/button';

interface FinishSetupContentProps {
  dictionary?: any;
}

export default function FinishSetupContent({ dictionary }: FinishSetupContentProps) {
  const dict = dictionary?.onboarding || {};
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { enableNext } = useHostValidation();

  // Enable next button for this step
  useEffect(() => {
    enableNext();
  }, [enableNext]);

  // Auto-play video when component mounts
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.log('Auto-play was prevented:', error);
      });
    }
  }, []);

  const illustration = (
    <div className="w-full sm:w-3/4 max-w-xl mx-auto bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl flex items-center justify-center overflow-hidden h-[300px] sm:aspect-video">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onLoadedData={() => {
          if (videoRef.current) {
            videoRef.current.play().catch((error) => {
              console.log('Video play failed:', error);
            });
          }
        }}
      >
        <source
          src="https://stream.media.muscache.com/KeNKUpa01dRaT5g00SSBV95FqXYkqf01DJdzn01F1aT00vCI.mp4?v_q=high"
          type="video/mp4"
        />
      </video>
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