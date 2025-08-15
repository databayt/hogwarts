"use client";

import React from 'react';

interface StepHeaderProps {
  stepNumber?: number;
  title: string;
  description?: string;
  illustration?: React.ReactNode;
}

const StepHeader: React.FC<StepHeaderProps> = ({
  stepNumber,
  title,
  description,
  illustration
}) => {
  return (
    <div className="w-full -mt-6 sm:-mt-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-6 lg:gap-12">
        {/* Left Side - Content */}
        <div className="space-y-4 sm:space-y-6">
          {stepNumber && (
            <div className="text-sm sm:text-base font-medium text-muted-foreground">
              Step {stepNumber}
            </div>
          )}
          
          <h1 className="text-xl sm:text-2xl lg:text-4xl font-medium text-foreground leading-tight">
            {title}
          </h1>
          
          {description && (
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Right Side - Illustration */}
        {illustration && (
          <div className="block lg:block order-first lg:order-last">
            <div className="relative">
              {illustration}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StepHeader; 