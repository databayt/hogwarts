"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  lang: Locale;
  id: string;
}

const VisibilityContent = (props: Props) => {
  const { dictionary, lang, id } = props;
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string>('full-transparency');


  const guestOptions = [
    {
      id: 'full-transparency',
      title: dictionary.onboarding.fullTransparency,
      description: dictionary.onboarding.fullTransparencyDescription
    },
    {
      id: 'limited-sharing',
      title: dictionary.onboarding.limitedSharing,
      description: dictionary.onboarding.limitedSharingDescription,
    },
  ];

  return (
    <div className="">
      <div className="">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-16 items-start">
          {/* Left column - Title and description */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            <h3>
              {dictionary.onboarding.visibilityPageTitle}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              {dictionary.onboarding.visibilityPageDescription}{' '}
              <button className="underline hover:no-underline text-foreground">
                {dictionary.onboarding.joinLearnMore}
              </button>
            </p>
          </div>

          {/* Right column - Guest options */}
          <div className="lg:col-span-3 space-y-3 sm:space-y-4">
            {guestOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedOption(option.id)}
                className={`w-full p-4 sm:p-5 rounded-xl border transition-all duration-200 text-left ${
                  selectedOption === option.id
                    ? 'border-foreground bg-accent'
                    : 'border-border hover:border-foreground/50'
                }`}
              >
                <div className="flex items-start space-x-3 sm:space-x-4">
                  {/* Radio button */}
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedOption === option.id
                        ? 'border-foreground bg-foreground'
                        : 'border-muted-foreground bg-background'
                    }`}>
                      {selectedOption === option.id && (
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-background"></div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h5 className="text-sm sm:text-base font-medium">
                        {option.title}
                      </h5>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisibilityContent; 
