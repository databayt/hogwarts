"use client";

import React from 'react';
import { GraduationCap, BookOpen, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface NewSchoolOptionsProps {
  onCreateNew?: () => void;
  onCreateFromTemplate?: () => void;
}

const NewSchoolOptions: React.FC<NewSchoolOptionsProps> = ({
  onCreateNew,
  onCreateFromTemplate
}) => {
  const handleCreateNew = (e: React.MouseEvent) => {
    e.preventDefault();
    onCreateNew?.();
  };

  const handleCreateFromTemplate = (e: React.MouseEvent) => {
    e.preventDefault();
    onCreateFromTemplate?.();
  };

  return (
    <div className="space-y-2 sm:space-y-3">
      <h5 className="text-base sm:text-lg font-semibold">
        Add a new school
      </h5>
      
      <div className="space-y-2">
        {/* Create a new school */}
        <Link href="/onboarding/overview" onClick={handleCreateNew} className="w-full flex items-center justify-between h-auto py-2 sm:py-3 border-b border-border transition-all group min-h-[50px] sm:min-h-[60px]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <h5 className="text-xs sm:text-sm font-medium">
                Create a new school
              </h5>
              <p className="text-xs text-muted-foreground mt-0.5">
                Start from scratch with basic setup
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
        </Link>

        {/* Create from template */}
        <Link href="/onboarding/overview" onClick={handleCreateFromTemplate} className="w-full flex items-center justify-between h-auto py-2 sm:py-3 border-b border-border transition-all group min-h-[50px] sm:min-h-[60px]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <h5 className="text-xs sm:text-sm font-medium">
                Use a school template
              </h5>
              <p className="text-xs text-muted-foreground mt-0.5">
                Start with pre-configured settings
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
        </Link>
      </div>
    </div>
  );
};

export default NewSchoolOptions;
