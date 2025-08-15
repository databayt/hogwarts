"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface HostStepHeaderProps {
  stepNumber?: number;
  title: string;
  description?: string;
  illustration?: React.ReactNode;
  className?: string;
}

const HostStepHeader: React.FC<HostStepHeaderProps> = ({
  stepNumber,
  title,
  description,
  illustration,
  className,
}) => {
  return (
    <div className={cn('w-full -mt-6 sm:-mt-10', className)}>
      <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-6 lg:gap-12">
        {/* Left Side - Content */}
        <div className="space-y-4 sm:space-y-6">
          {stepNumber && (
            <h6 className="text-sm sm:text-base font-medium text-muted-foreground">
              Step {stepNumber}
            </h6>
          )}
          
          <h2 className="leading-tight text-xl sm:text-2xl lg:text-3xl font-semibold">
            {title}
          </h2>
          
          {description && (
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
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

export default HostStepHeader; 