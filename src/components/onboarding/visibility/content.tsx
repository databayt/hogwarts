"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/components/internationalization/use-locale';
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
  const { isRTL } = useLocale();
  const [selectedOption, setSelectedOption] = useState<string>('full-transparency');

  const dict = (dictionary as any)?.school?.onboarding || {};

  const guestOptions = [
    {
      id: 'full-transparency',
      title: dict.fullTransparency || 'Full transparency',
      description: dict.fullTransparencyDescription || 'Share attendance reports, announcements, and academic progress with all relevant parties.'
    },
    {
      id: 'limited-sharing',
      title: dict.limitedSharing || 'Limited sharing',
      description: dict.limitedSharingDescription || 'Share only essential information and require approval for detailed reports.',
    },
  ];

  return (
    <div className="">
      <div className="">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-16 items-start">
          {/* Left column - Title and description */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            <h3>
              {dict.visibilityPageTitle || "Choose your school's information visibility"}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              {dict.visibilityPageDescription || 'This determines what information is shared with parents and students.'}{' '}
              <button className="underline hover:no-underline text-foreground">
                {dict.joinLearnMore || 'Learn more'}
              </button>
            </p>
          </div>

          {/* Right column - Guest options */}
          <div className="lg:col-span-3 space-y-3 sm:space-y-4">
            {guestOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedOption(option.id)}
                className={`w-full p-4 sm:p-5 rounded-xl border transition-all duration-200 ${isRTL ? 'text-right' : 'text-left'} ${
                  selectedOption === option.id
                    ? 'border-foreground bg-accent'
                    : 'border-border hover:border-foreground/50'
                }`}
              >
                <div className={`flex items-start ${isRTL ? 'space-x-reverse' : ''} space-x-3 sm:space-x-4`}>
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
                    <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-3`}>
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
