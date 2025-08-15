"use client";

import React from 'react';
import { StepHeader } from '@/components/onboarding';
import { useHostValidation } from '@/components/onboarding/host-validation-context';

interface StandOutPageProps {
  params: Promise<{ id: string }>;
}

const StandOutPage = ({ params }: StandOutPageProps) => {
  const [id, setId] = React.useState<string>('');
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const { enableNext } = useHostValidation();

  React.useEffect(() => {
    params.then((resolvedParams) => {
      setId(resolvedParams.id);
    });
  }, [params]);

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
          src="https://stream.media.muscache.com/H0101WTUG2qWbyFhy02jlOggSkpsM9H02VOWN52g02oxhDVM.mp4?v_q=high"
          type="video/mp4"
        />
      </video>
    </div>
  );

  return (
    <div className="">
      <div className="w-full">
        <StepHeader
          stepNumber={2}
          title="Make your place stand out"
          description="In this step, you'll add some of the amenities your place offers, plus 5 or more photos. Then, you'll create a title and description."
          illustration={illustration}
        />
      </div>
    </div>
  );
};

export default StandOutPage; 