"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

interface Step {
  number: number;
  title: string;
  description: string;
  illustration: string;
}

interface StepsOverviewProps {
  onGetStarted?: () => void;
}

const StepsOverview: React.FC<StepsOverviewProps> = ({ onGetStarted }) => {
  const steps: Step[] = [
    {
      number: 1,
      title: "Tell us about your school",
      description: "Share some basic info, like where it is, and how many students it has.",
      illustration: "/airbnb/place.webp"
    },
    {
      number: 2,
      title: "Add people and data",
      description: "Invite staff, and import students and classes—we'll help you out.. ",
      illustration: "/airbnb/stand-out.webp"
    },
    {
      number: 3,
      title: "Set up and launch",
      description: "Configure timetable and attendance, publish announcements, and go live.",
      illustration: "/airbnb/publish.png"
    }
  ];

  return (
    <div className="h-full flex flex-col px-20">
      <div className="flex-1">
        <div className="h-full max-w-7xl mx-auto flex flex-col">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-12 items-start py-12">
            {/* Left Side - Title */}
            <div>
              <h2>
                It's easy to 
                <br />
                get started on Hogwarts
              </h2>
            </div>

            {/* Right Side - Steps */}
            <div className="space-y-6">
              {steps.map((step) => (
                <div key={step.number} className="flex gap-6 items-start">
                  <div className="flex gap-3 flex-1">
                    <div className="flex-shrink-0">
                      <h4 className="text-foreground">
                        {step.number}
                      </h4>
                    </div>
                    <div>
                      <h4 className="mb-1">
                        {step.title}
                      </h4>
                      <p>
                        {step.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 hidden md:block">
                    <div className="relative w-24 h-24 overflow-hidden">
                      <Image
                        src={step.illustration}
                        alt={step.title}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Section with HR and Button */}
          <div className="">
            <Separator className="w-full" />
            <div className="flex justify-end py-4">
              <Button onClick={onGetStarted}>
                Get started
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepsOverview; 