"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/components/internationalization/use-locale';
import type { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
// import { CalendarCheckmark, LightningBoltIcon } from '@/components/atom/airbnb-icons';

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  lang: Locale;
  id: string;
}

const JoinContent = (props: Props) => {
  const { dictionary, lang, id } = props;
  const router = useRouter();
  const { isRTL } = useLocale();
  const [selectedOption, setSelectedOption] = useState<string>('invite-with-codes');

  const dict = (dictionary as any)?.school?.onboarding || {};

  const bookingOptions = [
    {
      id: 'invite-with-codes',
      title: dict.inviteWithCodes || 'Invite with registration codes',
      subtitle: dict.inviteWithCodesSubtitle || 'Recommended',
      description: dict.inviteWithCodesDescription || 'Generate invitation codes that teachers, staff, students and parents can use to self-register. You can review and finalizing.',
      // icon: CalendarCheckmark,
      recommended: true,
    },
    {
      id: 'manual-enrollment',
      title: dict.manualEnrollment || 'Manual enrollment',
      description: dict.manualEnrollmentDescription || 'Add all teachers, staff, and students yourself through the admin panel.',
      // icon: LightningBoltIcon,
      recommended: false,
    },
  ];

  return (
    <div className="">
      <div className="">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-16 items-start">
          {/* Left column - Title and description */}
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-3xl font-bold">
              {dict.joinPageTitle || 'How students'}<br /> {dict.joinPageTitleBreak || 'join your school'}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {dict.joinPageDescription || 'You can change this at any time.'}{' '}
              <button className="underline hover:no-underline text-foreground">
                {dict.joinLearnMore || 'Learn more'}
              </button>
            </p>
          </div>

          {/* Right column - Booking options */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {bookingOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedOption(option.id)}
                className={`w-full py-4 sm:py-5 px-4 sm:px-8 rounded-xl border transition-all duration-200 ${isRTL ? 'text-right' : 'text-left'} ${
                  selectedOption === option.id
                    ? 'border-foreground bg-accent'
                    : 'border-border hover:border-foreground/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-3`}>
                      <h5 className="text-sm sm:text-base font-medium">
                        {option.title}
                      </h5>
                    </div>
                    {option.recommended && (
                        <span className="text-green-500 text-xs sm:text-sm">
                          {option.subtitle}
                        </span>
                      )}
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  </div>
                  <div className={`flex-shrink-0 ${isRTL ? 'mr-3' : 'ml-3'}`}>
                    {/* <option.icon size={20} className="sm:w-6 sm:h-6" /> */}
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

export default JoinContent; 
