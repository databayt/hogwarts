"use client";

import React from 'react';
import HostStepHeader from '@/components/onboarding/step-header';
import { useHostValidation } from '@/components/onboarding/host-validation-context';

interface StandOutContentProps {
  dictionary?: any;
}

export default function StandOutContent({ dictionary }: StandOutContentProps) {
  const dict = dictionary?.onboarding || {};
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const { enableNext } = useHostValidation();

  // Enable next button for this informational page
  React.useEffect(() => {
    enableNext();
  }, [enableNext]);

  // Auto-play video when component mounts
  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.log('Auto-play was prevented:', error);
      });
    }
  }, []);

  const illustration = (
    <div className="w-full sm:w-3/4 max-w-xl mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl flex items-center justify-center overflow-hidden h-[300px] sm:aspect-video">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        muted
        playsInline
        preload="auto"
        onLoadedData={() => {
          // Ensure video plays after loading
          if (videoRef.current) {
            videoRef.current.play().catch((error) => {
              console.log('Video play failed:', error);
            });
          }
        }}
      >
        <source
          src="https://stream.media.muscache.com/H0101WTUG2qWbyFhy02jlOggSkpsM9H02VOWN52g02oxhDVM.mp4?v_q=high"
          type="video/mp4"
        />
      </video>
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
