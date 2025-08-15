"use client";

import React from 'react';
import HostStepHeader from '@/components/onboarding/step-header';
import { useHostValidation } from '@/components/onboarding/host-validation-context';


export default function AboutSchoolContent() {
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
    <div className="w-full sm:w-3/4 max-w-xl mx-auto bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl sm:rounded-2xl flex items-center justify-center overflow-hidden h-[300px] sm:aspect-video">
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
          src="https://stream.media.muscache.com/zFaydEaihX6LP01x8TSCl76WHblb01Z01RrFELxyCXoNek.mp4?v_q=high"
          type="video/mp4"
        />
      </video>
    </div>
  );

  return (
    <div className="">
      <div className="w-full">
        <HostStepHeader
          stepNumber={1}
          title="Tell us about your school"
          description="In this step, we'll ask you about your school type, location, and student capacity. Then we'll help you set up your academic structure."
          illustration={illustration}
        />
      </div>
    </div>
  );
}
