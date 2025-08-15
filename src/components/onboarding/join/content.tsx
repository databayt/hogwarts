"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
// import { CalendarCheckmark, LightningBoltIcon } from '@/components/atom/airbnb-icons';

interface JoinProps {
  params: Promise<{ id: string }>;
}
const JoinContent = ({ params }: JoinProps) => {
  const router = useRouter();
  const [id, setId] = React.useState<string>('');
  const [selectedOption, setSelectedOption] = useState<string>('invite-with-codes');

  React.useEffect(() => {
    params.then((resolvedParams) => {
      setId(resolvedParams.id);
    });
  }, [params]);


  const bookingOptions = [
    {
      id: 'invite-with-codes',
      title: 'Invite with registration codes',
      subtitle: 'Recommended',
      description: 'Generate invitation codes that teachers, staff, students and parents can use to self-register. You can review and finalizing.',
      // icon: CalendarCheckmark,
      recommended: true,
    },
    {
      id: 'manual-enrollment',
      title: 'Manual enrollment',
      description: 'Add all teachers, staff, and students yourself through the admin panel.',
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
            <h3>
            How students<br /> join your school
              
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              You can change this at any time.{' '}
              <button className="underline hover:no-underline text-foreground">
                Learn more
              </button>
            </p>
          </div>

          {/* Right column - Booking options */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {bookingOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedOption(option.id)}
                className={`w-full py-4 sm:py-5 px-4 sm:px-8 rounded-xl border transition-all duration-200 text-left ${
                  selectedOption === option.id
                    ? 'border-foreground bg-accent'
                    : 'border-border hover:border-foreground/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
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
                  <div className="flex-shrink-0 ml-3">
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
