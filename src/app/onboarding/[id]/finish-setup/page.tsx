"use client";

import React from 'react';
import { StepHeader } from '@/components/onboarding';
import { useHostValidation } from '@/components/onboarding/host-validation-context';
import { ListingProvider, useListing } from '@/components/onboarding/use-listing';

interface FinishSetupPageProps {
  params: Promise<{ id: string }>;
}

const FinishSetupPageContent = ({ params }: FinishSetupPageProps) => {
  const [id, setId] = React.useState<string>('');
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const { enableNext } = useHostValidation();
  const { listing, loadListing } = useListing();

  React.useEffect(() => {
    params.then((resolvedParams) => {
      setId(resolvedParams.id);
      // Load the listing data in the background
      const listingId = parseInt(resolvedParams.id);
      if (!isNaN(listingId)) {
        loadListing(listingId).catch(console.error);
      }
    });
  }, [params, loadListing]);

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
          src="https://stream.media.muscache.com/KeNKUpa01dRaT5g00SSBV95FqXYkqf01DJdzn01F1aT00vCI.mp4?v_q=high"
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
          title="Finish up and publish"
          description="Finally, you'll choose booking settings, set up pricing, and publish your listing."
          illustration={illustration}
        />
      </div>
    </div>
  );
};

const FinishSetupPage = ({ params }: FinishSetupPageProps) => {
  return (
    <ListingProvider>
      <FinishSetupPageContent params={params} />
    </ListingProvider>
  );
};

export default FinishSetupPage; 